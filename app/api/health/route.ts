// GET /api/health — лёгкий пинг для UptimeRobot и подобных.
// Ничего не парсит и не ходит во внешнюю сеть: нужен только чтобы инстанс не засыпал.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kitis-schedule",
    time: new Date().toISOString(),
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 });
}
