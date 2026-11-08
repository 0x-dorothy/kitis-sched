// GET /api/directory — справочник групп/преподавателей/аудиторий

import { NextResponse } from "next/server";
import { getDirectory } from "@/lib/schedule-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const dir = await getDirectory();
    return NextResponse.json(dir);
  } catch (e) {
    return NextResponse.json(
      { error: "source-unavailable", message: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}
