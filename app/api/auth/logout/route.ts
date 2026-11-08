// POST /api/auth/logout — выход

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
