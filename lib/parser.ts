// Парсер HTML «Экспресс-расписания» (cheerio).
//
// Формат источника:
//  - списки: cg.htm / cp.htm / ca.htm — таблица ссылок <a class="z0" href="cg95.htm">
//  - расписание: cg95.htm / cp131.htm / ca106.htm — таблица «день × пара»,
//    ячейки занятия class="ur" (пустые — class="nul").
//    Классы ссылок в ячейке различаются между представлениями, поэтому
//    разбираем по href: cg*=группа, cp*=преподаватель, ca*=аудитория, j*=предмет.
//    Подгруппы: несколько <td class="ur"> в строке (1-я → п/г 1, 2-я → п/г 2),
//    вся группа — один td c colspan="2".

import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type {
  DaySchedule,
  EntityRef,
  Lesson,
  ScheduleType,
  WeekSchedule,
} from "./types";
import { weekdayOf } from "./weeks";

const REF_RE = /^(cg|cp|ca)(\d+)\.htm$/;

function refFromHref(href: string, name: string): EntityRef | null {
  const m = REF_RE.exec(href.trim());
  if (!m) return null;
  return { id: `${m[1]}${m[2]}`, name };
}

// ---------- Списки (справочник) ----------

export function parseDirectory(html: string): {
  groups: EntityRef[];
  teachers: EntityRef[];
  rooms: EntityRef[];
} {
  const $ = cheerio.load(html);
  const items: EntityRef[] = [];
  $("table.inf a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const name = $(el).text().trim();
    const ref = refFromHref(href, name);
    if (ref && name) items.push(ref);
  });
  return {
    groups: items.filter((r) => r.id.startsWith("cg")),
    teachers: items.filter((r) => r.id.startsWith("cp")),
    rooms: items.filter((r) => r.id.startsWith("ca")),
  };
}

// ---------- Расписание ----------

interface CellRefs {
  subject: string;
  groups: EntityRef[];
  teacher?: EntityRef;
  room?: EntityRef;
}

function parseLessonCell($: cheerio.CheerioAPI, cell: Element): CellRefs | null {
  const out: CellRefs = { subject: "", groups: [] };
  $(cell)
    .find("a")
    .each((_, a) => {
      const href = $(a).attr("href") ?? "";
      const name = $(a).text().trim();
      if (!name) return;
      if (/^j\d+\.htm$/.test(href)) {
        out.subject = name;
      } else if (/^cg\d+\.htm$/.test(href)) {
        out.groups.push({ id: href.replace(".htm", ""), name });
      } else if (/^cp\d+\.htm$/.test(href)) {
        out.teacher = { id: href.replace(".htm", ""), name };
      } else if (/^ca\d+\.htm$/.test(href)) {
        out.room = { id: href.replace(".htm", ""), name };
      }
    });
  // Текст вне ссылок (бывает, что предмет без ссылки)
  if (!out.subject) {
    const clone = $(cell).clone();
    clone.find("a, br").remove();
    out.subject = clone.text().replace(/\s+/g, " ").trim();
  }
  if (!out.subject && out.groups.length === 0 && !out.teacher && !out.room) return null;
  return out;
}

/**
 * Разбор страницы расписания (представление группы, преподавателя или аудитории).
 */
export function parseSchedule(
  html: string,
  type: ScheduleType,
  id: string,
  title: string,
  updatedAt: string
): WeekSchedule {
  const $ = cheerio.load(html);
  const days: DaySchedule[] = [];
  let currentDay: DaySchedule | null = null;

  $("table.inf tr").each((_, tr) => {
    const tds = $(tr).find("td").toArray();

    // Ячейка дня: rowspan + текст вида «09.11.2026Пн»
    const dayTd = tds.find((td) => {
      if ($(td).attr("rowspan") === undefined) return false;
      return /\d{2}\.\d{2}\.\d{4}/.test($(td).text());
    });

    if (dayTd) {
      const dateMatch = $(dayTd).text().match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dateMatch) {
        const iso = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        currentDay = { date: iso, weekday: weekdayOf(iso), lessons: {} };
        days.push(currentDay);
      }
    }

    if (!currentDay) return;

    // Строка пары: первый td (после ячейки дня, если она в этой строке) — номер пары
    const restTds = dayTd ? tds.filter((td) => td !== dayTd) : tds;
    const firstTd = restTds[0];
    if (!firstTd) return;
    const pairNum = parseInt($(firstTd).text().trim(), 10);
    if (!Number.isInteger(pairNum) || pairNum < 1 || pairNum > 9) return;

    // Остальные td в строке — ячейки занятия (п/г 1, п/г 2) или пустые
    const lessonTds = restTds.slice(1).filter(
      (td) => td.attribs?.class === "ur" || td.attribs?.class === "nul"
    );

    const lessons: Lesson[] = [];
    lessonTds.forEach((td, idx) => {
      if (td.attribs?.class === "nul") return;
      const refs = parseLessonCell($, td);
      if (!refs) return;
      const colspan = parseInt(td.attribs?.colspan ?? "1", 10) || 1;
      // Один td на всю группу (colspan 2) или две отдельные ячейки — по позиции
      const subgroups = colspan >= 2 ? [1, 2] : [idx + 1];
      lessons.push({
        pair: pairNum,
        subject: refs.subject,
        groups: refs.groups,
        teacher: refs.teacher,
        room: refs.room,
        subgroups,
      });
    });

    if (lessons.length > 0) currentDay.lessons[pairNum] = lessons;
  });

  return { type, id, title, weekStart: "", updatedAt, days };
}
