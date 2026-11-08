// POST /api/auth/register — регистрация (email, пароль, имя, группа, куратор)

import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureSchema, getSql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasDb()) {
    return NextResponse.json(
      {
        error: "db-not-configured",
        message:
          "База данных не подключена. Добавьте DATABASE_URL (см. README — раздел «Подключение базы»).",
      },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();
  const groupName = String(body?.group ?? "").trim();
  const curator = String(body?.curator ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "bad-email", message: "Некорректный email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "weak-password", message: "Пароль должен быть не короче 6 символов." },
      { status: 400 }
    );
  }

  const sql = getSql()!;
  await ensureSchema();
  const exists = (await sql`SELECT 1 FROM users WHERE email = ${email} LIMIT 1`).length > 0;
  if (exists) {
    return NextResponse.json(
      { error: "email-taken", message: "Пользователь с таким email уже зарегистрирован." },
      { status: 409 }
    );
  }

  const hash = await hashPassword(password);
  const rows = (await sql`
    INSERT INTO users (email, password_hash, name, group_name, curator)
    VALUES (${email}, ${hash}, ${name}, ${groupName}, ${curator})
    RETURNING id, email, name, group_name, curator`) as Record<string, unknown>[];
  const u = rows[0];
  await createSession(u.id as number);

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      groupName: u.group_name,
      curator: u.curator,
    },
  });
}
