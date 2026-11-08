// Сервис расписания: справочник + загрузка/архивация недель.
//
// Стратегия недель: источник перезаписывает файлы при публикации новой
// недели (обычно чт–сб), поэтому каждую увиденную неделю мы сохраняем
// снапшотом в БД (week_snapshots). Текущая (живая) неделя всегда берётся
// с источника и параллельно складывается в архив; прошлые недели
// отдаются только из архива.

import {
  extractFirstDate,
  extractTitle,
  extractUpdatedAt,
  fetchSourcePage,
} from "./source";
import { parseDirectory, parseSchedule } from "./parser";
import type {
  Directory,
  EntityRef,
  ScheduleResponse,
  ScheduleType,
  WeekMeta,
  WeekSchedule,
} from "./types";
import { mondayOf, currentWeekStart } from "./weeks";
import { ensureSchema, getSql, hasDb } from "./db";

// ---------- Справочник ----------

let dirCache: { data: Directory & { updatedAt: string }; ts: number } | null = null;
const DIR_TTL_MS = 30 * 60 * 1000;

export async function getDirectory(): Promise<Directory & { updatedAt: string }> {
  if (dirCache && Date.now() - dirCache.ts < DIR_TTL_MS) return dirCache.data;
  // Списки живут на трёх страницах: cg.htm / cp.htm / ca.htm
  const [groupsHtml, teachersHtml, roomsHtml] = await Promise.all([
    fetchSourcePage("cg.htm"),
    fetchSourcePage("cp.htm"),
    fetchSourcePage("ca.htm"),
  ]);
  const parsed = {
    ...parseDirectory(groupsHtml),
    teachers: parseDirectory(teachersHtml).teachers,
    rooms: parseDirectory(roomsHtml).rooms,
  };
  const updatedAt = extractUpdatedAt(groupsHtml);
  const data = { ...parsed, updatedAt };
  dirCache = { data, ts: Date.now() };
  return data;
}

export async function findEntity(
  kind: ScheduleType,
  id: string
): Promise<EntityRef | null> {
  const dir = await getDirectory();
  const list = kind === "group" ? dir.groups : kind === "teacher" ? dir.teachers : dir.rooms;
  return list.find((e) => e.id === id) ?? null;
}

// ---------- Живое расписание ----------

export async function getLiveSchedule(
  kind: ScheduleType,
  id: string
): Promise<WeekSchedule> {
  const html = await fetchSourcePage(`${id}.htm`);
  const title = extractTitle(html) || id;
  const updatedAt = extractUpdatedAt(html);
  const schedule = parseSchedule(html, kind, id, title, updatedAt);
  const firstDate = extractFirstDate(html);
  schedule.weekStart = firstDate ? mondayOf(firstDate) : currentWeekStart();
  return schedule;
}

// ---------- Архив (требуется БД) ----------

async function saveSnapshot(schedule: WeekSchedule): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await ensureSchema();
  await sql`
    INSERT INTO week_snapshots (kind, item_id, week_start, title, data, source_updated_at, fetched_at)
    VALUES (${schedule.type}, ${schedule.id}, ${schedule.weekStart}, ${schedule.title},
            ${JSON.stringify(schedule)}, ${schedule.updatedAt}, now())
    ON CONFLICT (kind, item_id, week_start)
    DO UPDATE SET data = ${JSON.stringify(schedule)},
                  title = ${schedule.title},
                  source_updated_at = ${schedule.updatedAt},
                  fetched_at = now()`;
}

export async function getAvailableWeeks(
  kind: ScheduleType,
  id: string
): Promise<WeekMeta[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT week_start::text, fetched_at
      FROM week_snapshots
      WHERE kind = ${kind} AND item_id = ${id}
      ORDER BY week_start DESC
      LIMIT 60`;
    return (rows as Record<string, unknown>[]).map((r) => ({
      weekStart: r.week_start as string,
      fetchedAt: r.fetched_at ? new Date(r.fetched_at as string).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}

async function loadSnapshot(
  kind: ScheduleType,
  id: string,
  weekStart: string
): Promise<WeekSchedule | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT data FROM week_snapshots
      WHERE kind = ${kind} AND item_id = ${id} AND week_start = ${weekStart}
      LIMIT 1`;
    const r = rows[0] as { data: WeekSchedule } | undefined;
    return r?.data ?? null;
  } catch {
    return null;
  }
}

// ---------- Публичный API ----------

/**
 * Расписание на неделю. Без week — живая неделя с источника (и снапшот в БД).
 * С week — из архива; если запрошена живая неделя, всё равно идём на источник.
 */
export async function getSchedule(
  kind: ScheduleType,
  id: string,
  week?: string
): Promise<ScheduleResponse> {
  const live = await getLiveSchedule(kind, id);
  const liveWeek = live.weekStart;

  if (!week || week === liveWeek) {
    // Фоново обновляем снапшот, не задерживая ответ
    void saveSnapshot(live).catch(() => {});
    return {
      schedule: live,
      availableWeeks: await getAvailableWeeks(kind, id),
      archived: false,
    };
  }

  const snapshot = await loadSnapshot(kind, id, week);
  if (snapshot) {
    return {
      schedule: snapshot,
      availableWeeks: await getAvailableWeeks(kind, id),
      archived: true,
    };
  }

  // Нет в архиве: если источник всё ещё отдаёт старую неделю, попробуем её отдать
  if (liveWeek === week) {
    void saveSnapshot(live).catch(() => {});
    return {
      schedule: live,
      availableWeeks: await getAvailableWeeks(kind, id),
      archived: false,
    };
  }

  throw new Error("week-not-found");
}

// ---------- Синхронизация (cron + ленивое обновление) ----------

export interface SyncResult {
  kind: ScheduleType;
  id: string;
  weekStart: string;
  updatedAt: string;
  updated: boolean; // снапшот изменился
}

/** Синхронизация одной сущности: тянет источник, сохраняет снапшот недели. */
export async function syncEntity(
  kind: ScheduleType,
  id: string
): Promise<SyncResult> {
  const live = await getLiveSchedule(kind, id);

  let updated = true;
  const sql = getSql();
  if (sql) {
    const prev = await loadSnapshot(kind, id, live.weekStart);
    if (prev && prev.updatedAt === live.updatedAt) updated = false;
  }
  await saveSnapshot(live);
  return { kind, id, weekStart: live.weekStart, updatedAt: live.updatedAt, updated };
}

/** Полная синхронизация: все группы + преподаватели + аудитории + справочник. */
export async function syncAll(): Promise<{
  total: number;
  changed: number;
  directory: Directory;
}> {
  const dir = await getDirectory(); // обновит кэш справочника
  const all: { kind: ScheduleType; id: string }[] = [
    ...dir.groups.map((g) => ({ kind: "group" as const, id: g.id })),
    ...dir.teachers.map((t) => ({ kind: "teacher" as const, id: t.id })),
    ...dir.rooms.map((r) => ({ kind: "room" as const, id: r.id })),
  ];

  let changed = 0;
  let done = 0;
  const CONCURRENCY = 6;
  for (let i = 0; i < all.length; i += CONCURRENCY) {
    const batch = all.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((x) => syncEntity(x.kind, x.id)));
    for (const r of results) {
      done++;
      if (r.status === "fulfilled" && r.value.updated) changed++;
    }
  }
  return { total: done, changed, directory: { groups: dir.groups, teachers: dir.teachers, rooms: dir.rooms } };
}

export { hasDb };
