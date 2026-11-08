// GET / POST / DELETE /api/favorites — избранное (только для авторизованных;
// у гостей избранное хранится в localStorage, см. lib/favorites.ts)

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FavRow {
  kind: string;
  item_id: string;
  label: string;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sql = getSql()!;
  await ensureSchema();
  const rows = (await sql`
    SELECT kind, item_id, label FROM favorites
    WHERE user_id = ${user.id} ORDER BY created_at DESC`) as FavRow[];
  return NextResponse.json({
    favorites: rows.map((r) => ({ type: r.kind, id: r.item_id, label: r.label })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const type = String(body?.type ?? "");
  const id = String(body?.id ?? "");
  const label = String(body?.label ?? "");
  if (!/^(group|teacher|room)$/.test(type) || !/^(cg|cp|ca)\d+$/.test(id)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const sql = getSql()!;
  await ensureSchema();
  await sql`
    INSERT INTO favorites (user_id, kind, item_id, label)
    VALUES (${user.id}, ${type}, ${id}, ${label})
    ON CONFLICT (user_id, kind, item_id) DO NOTHING`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") ?? "";
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^(group|teacher|room)$/.test(type) || !/^(cg|cp|ca)\d+$/.test(id)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const sql = getSql()!;
  await ensureSchema();
  await sql`DELETE FROM favorites WHERE user_id = ${user.id} AND kind = ${type} AND item_id = ${id}`;
  return NextResponse.json({ ok: true });
}
