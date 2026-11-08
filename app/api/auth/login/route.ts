// POST /api/auth/login — вход по email и паролю

import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
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

  const sql = getSql()!;
  await ensureSchema();
  const rows = (await sql`
    SELECT id, password_hash, email, name, group_name, curator
    FROM users WHERE email = ${email} LIMIT 1`) as Record<string, unknown>[];
  const u = rows[0];
  if (!u || !(await verifyPassword(password, u.password_hash as string))) {
    return NextResponse.json(
      { error: "invalid-credentials", message: "Неверный email или пароль." },
      { status: 401 }
    );
  }

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
