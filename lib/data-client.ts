// Источник данных для статической версии: JSON-файлы в /data,
// которые готовит скрипт scripts/snapshot.ts по расписанию (GitHub Actions).

import type { Directory, ScheduleResponse, ScheduleType, WeekSchedule } from "./types";
import { BASE_PATH } from "./base-path";

const DATA = `${BASE_PATH}/data`;

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA}/${file}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`data-unavailable:${res.status}`);
  return (await res.json()) as T;
}

export interface DirectoryData extends Directory {
  updatedAt: string;
  generatedAt?: string;
}

export interface MetaData {
  generatedAt: string;
  sourceUpdatedAt: string;
  weekStart: string;
}

export async function fetchDirectory(): Promise<DirectoryData> {
  return getJson<DirectoryData>("directory.json");
}

export async function fetchMeta(): Promise<MetaData> {
  return getJson<MetaData>("meta.json");
}

/** Список недель, доступных в архиве для сущности (может быть пустым). */
export async function fetchArchiveWeeks(id: string): Promise<string[]> {
  try {
    const data = await getJson<{ weeks: string[] }>(`archive/${id}.json`);
    return data.weeks ?? [];
  } catch {
    return [];
  }
}

export type ScheduleErrorKind = "not-published" | "not-archived" | "no-data";

export class ScheduleError extends Error {
  kind: ScheduleErrorKind;
  constructor(kind: ScheduleErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

/**
 * Расписание сущности. Без week — текущая опубликованная неделя.
 * С week — архивная неделя; если её нет:
 *   - неделя позже текущей → «ещё не опубликовано»,
 *   - неделя раньше → «нет в архиве».
 */
export async function fetchSchedule(
  type: ScheduleType,
  id: string,
  week?: string
): Promise<ScheduleResponse> {
  const current = await getJson<WeekSchedule>(`schedules/${id}.json`).catch(() => null);
  const meta = await fetchMeta().catch(() => null);
  const currentWeek = current?.weekStart ?? meta?.weekStart ?? "";
  const availableWeeks = (await fetchArchiveWeeks(id)).map((w) => ({ weekStart: w }));

  if (!week || week === currentWeek) {
    if (!current) throw new ScheduleError("no-data");
    return { schedule: current, availableWeeks, archived: false };
  }

  try {
    const archived = await getJson<WeekSchedule>(`archive/${id}/${week}.json`);
    return { schedule: archived, availableWeeks, archived: true };
  } catch {
    if (currentWeek && week > currentWeek) throw new ScheduleError("not-published");
    throw new ScheduleError("not-archived");
  }
}
