// GET /api/auth/me — текущий пользователь (null для гостя)

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user, dbConfigured: hasDb() });
}
