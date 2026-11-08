// GET /api/schedule?type=group&id=cg95[&week=2026-11-09]
// Расписание на неделю: живой парсинг источника + снапшоты в БД (архив недель).

import { NextRequest, NextResponse } from "next/server";
import { findEntity, getSchedule } from "@/lib/schedule-service";
import type { ScheduleType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KINDS: ScheduleType[] = ["group", "teacher", "room"];

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "group";
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const week = req.nextUrl.searchParams.get("week") ?? undefined;

  if (!KINDS.includes(type as ScheduleType) || !/^(cg|cp|ca)\d+$/.test(id)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  try {
    const entity = await findEntity(type as ScheduleType, id);
    const result = await getSchedule(
      type as ScheduleType,
      id,
      week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : undefined
    );
    // Подстрахуемся названием из справочника
    if (entity && result.schedule.title === result.schedule.id) {
      result.schedule.title = entity.name;
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "week-not-found") {
      return NextResponse.json(
        {
          error: "week-not-found",
          message:
            "Эта неделя не сохранена в архиве. Архив работает после подключения базы данных (см. README).",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "source-unavailable", message: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}
