// Собственная авторизация: email + пароль (bcrypt), JWT в httpOnly-cookie.
// Без внешних сервисов и платежей.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getSql, ensureSchema } from "./db";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "dev-only-insecure-secret-change-me-in-production-0123456789";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  groupName: string;
  curator: string;
}

/** Текущий пользователь или null (гость) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.uid;
    if (typeof uid !== "number") return null;
    await ensureSchema();
    const rows = await sql`
      SELECT id, email, name, group_name, curator
      FROM users WHERE id = ${uid} LIMIT 1`;
    const r = rows[0] as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      id: r.id as number,
      email: r.email as string,
      name: r.name as string,
      groupName: r.group_name as string,
      curator: r.curator as string,
    };
  } catch {
    return null;
  }
}
