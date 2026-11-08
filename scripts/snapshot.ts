// Снапшот расписания: обходит сайт-источник и складывает JSON в public/data.
// Запускается по крону в GitHub Actions (и вручную: npm run snapshot).

import fs from "node:fs/promises";
import path from "node:path";
import { extractFirstDate, extractTitle, extractUpdatedAt, fetchSourcePage } from "../lib/source";
import { parseDirectory, parseSchedule } from "../lib/parser";
import { currentWeekStart, mondayOf } from "../lib/weeks";
import type { EntityRef, ScheduleType, WeekSchedule } from "../lib/types";

const OUT = path.join(process.cwd(), "public", "data");
const SCHEDULES = path.join(OUT, "schedules");
const ARCHIVE = path.join(OUT, "archive");
const ARCHIVE_WEEKS_KEPT = 12;
const CONCURRENCY = 6;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data), "utf8");
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function main() {
  console.log("→ справочники");
  const [groupsHtml, teachersHtml, roomsHtml] = await Promise.all([
    fetchSourcePage("cg.htm"),
    fetchSourcePage("cp.htm"),
    fetchSourcePage("ca.htm"),
  ]);

  const groups = parseDirectory(groupsHtml).groups;
  const teachers = parseDirectory(teachersHtml).teachers;
  const rooms = parseDirectory(roomsHtml).rooms;
  const updatedAt = extractUpdatedAt(groupsHtml);
  const generatedAt = new Date().toISOString();

  console.log(`  группы: ${groups.length}, преподаватели: ${teachers.length}, аудитории: ${rooms.length}`);

  await writeJson(path.join(OUT, "directory.json"), {
    groups,
    teachers,
    rooms,
    updatedAt,
    generatedAt,
  });

  const entities: { kind: ScheduleType; ref: EntityRef }[] = [
    ...groups.map((ref) => ({ kind: "group" as const, ref })),
    ...teachers.map((ref) => ({ kind: "teacher" as const, ref })),
    ...rooms.map((ref) => ({ kind: "room" as const, ref })),
  ];

  let weekStart = "";
  let done = 0;
  const failures: string[] = [];

  await pool(entities, CONCURRENCY, async ({ kind, ref }) => {
    try {
      const html = await fetchSourcePage(`${ref.id}.htm`);
      const title = extractTitle(html) || ref.name || ref.id;
      const schedule = parseSchedule(html, kind, ref.id, title, extractUpdatedAt(html));
      const firstDate = extractFirstDate(html);
      schedule.weekStart = firstDate ? mondayOf(firstDate) : currentWeekStart();
      weekStart = schedule.weekStart;

      await writeJson(path.join(SCHEDULES, `${ref.id}.json`), schedule satisfies WeekSchedule);

      // Архив — только для групп, чтобы не раздувать репозиторий.
      if (kind === "group") {
        await saveArchive(schedule);
      }
    } catch (e) {
      failures.push(`${ref.id}: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${entities.length}`);
    }
  });

  // чистим расписания сущностей, которых больше нет в справочнике
  const keep = new Set(entities.map((e) => `${e.ref.id}.json`));
  for (const file of await fs.readdir(SCHEDULES).catch(() => [] as string[])) {
    if (!keep.has(file)) await fs.rm(path.join(SCHEDULES, file), { force: true });
  }

  await writeJson(path.join(OUT, "meta.json"), {
    generatedAt,
    sourceUpdatedAt: updatedAt,
    weekStart: weekStart || currentWeekStart(),
  });

  console.log(`✓ готово: ${entities.length - failures.length}/${entities.length}, неделя ${weekStart}`);
  if (failures.length) console.log(`  ошибки: ${failures.slice(0, 10).join("; ")}`);
}

async function saveArchive(schedule: WeekSchedule) {
  const file = path.join(ARCHIVE, schedule.id, `${schedule.weekStart}.json`);
  const exists = await readJson<WeekSchedule>(file);
  if (!exists) await writeJson(file, schedule);

  const dir = path.join(ARCHIVE, schedule.id);
  const weeks = (await fs.readdir(dir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .reverse();

  for (const old of weeks.slice(ARCHIVE_WEEKS_KEPT)) {
    await fs.rm(path.join(dir, `${old}.json`), { force: true });
  }

  await writeJson(path.join(ARCHIVE, `${schedule.id}.json`), {
    weeks: weeks.slice(0, ARCHIVE_WEEKS_KEPT),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
