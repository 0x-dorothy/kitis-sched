// Источник данных для статической версии: JSON-файлы в /data,
// которые готовит скрипт scripts/snapshot.ts по расписанию (GitHub Actions).

import type { Directory, ScheduleResponse, ScheduleType, WeekSchedule } from "./types";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
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

export async function fetchDirectory(): Promise<DirectoryData> {
  return getJson<DirectoryData>("directory.json");
}

export interface MetaData {
  generatedAt: string;
  sourceUpdatedAt: string;
  weekStart: string;
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

/**
 * Расписание сущности. Без week — текущая неделя из снапшота.
 * С week — неделя из архива; если её нет, бросаем week-not-found.
 */
export async function fetchSchedule(
  type: ScheduleType,
  id: string,
  week?: string
): Promise<ScheduleResponse> {
  const current = await getJson<WeekSchedule>(`schedules/${id}.json`);
  const availableWeeks = (await fetchArchiveWeeks(id)).map((w) => ({ weekStart: w }));

  if (!week || week === current.weekStart) {
    return { schedule: current, availableWeeks, archived: false };
  }

  try {
    const archived = await getJson<WeekSchedule>(`archive/${id}/${week}.json`);
    return { schedule: archived, availableWeeks, archived: true };
  } catch {
    const err = new Error("week-not-found");
    throw err;
  }
}
