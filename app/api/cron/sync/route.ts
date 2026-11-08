// POST/GET /api/cron/sync — ежедневный снапшот всего расписания в архив.
// Vercel Cron авторизуется заголовком Authorization со значением CRON_SECRET.
// На Hobby-тарифе крон запускается раз в день; новые недели (публикуются чт–сб)
// подхватываются максимум за сутки, плюс мгновенно при первом заходе любого
// пользователя (ленивое обновление в /api/schedule).

import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/schedule-service";
import { hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // без секрета не блокируем (для локальной проверки)
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Без БД архивировать некуда — не тратим время функции на полный обход сайта.
  if (!hasDb()) {
    return NextResponse.json({ ok: true, skipped: "no-database" });
  }
  try {
    const result = await syncAll();
    return NextResponse.json({
      ok: true,
      total: result.total,
      changed: result.changed,
      groups: result.directory.groups.length,
      teachers: result.directory.teachers.length,
      rooms: result.directory.rooms.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "sync-failed", message: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
