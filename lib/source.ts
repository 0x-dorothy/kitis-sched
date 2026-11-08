// Загрузка страниц сайта-источника («Экспресс-расписание»).
// Сайт отдаёт windows-1251 и не имеет CORS — работает только на сервере.

import { parseRuDate } from "./weeks";

export const SOURCE_BASE = "http://94.72.18.202:8083";
export const SOURCE_URL = SOURCE_BASE + "/";

const DECODER = new TextDecoder("windows-1251");

// Простой in-memory кэш (в рамках тёплого serverless-инстанса / dev-сервера)
const cache = new Map<string, { html: string; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchSourcePage(page: string): Promise<string> {
  const key = page.replace(/^\//, "");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.html;

  const res = await fetch(`${SOURCE_BASE}/${key}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "college-schedule/1.0" },
  });
  if (!res.ok) throw new Error(`Источник недоступен: HTTP ${res.status}`);
  const html = DECODER.decode(Buffer.from(await res.arrayBuffer()));
  cache.set(key, { html, ts: Date.now() });
  return html;
}

/** Метка «Обновлено: 06.11.2026 в 16:20» со страницы источника */
export function extractUpdatedAt(html: string): string {
  const m = html.match(/Обновлено:\s*([\d.]+)\s*в\s*([\d:]+)/);
  return m ? `${m[1]} в ${m[2]}` : "";
}

/** Дата обновления как ISO (для сравнения свежести снапшотов) */
export function extractUpdatedAtISO(html: string): string | null {
  const m = html.match(/Обновлено:\s*(\d{2})\.(\d{2})\.(\d{4})\s*в\s*(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`;
}

/** Заголовок H1 страницы («Группа: ИСр24-1») */
export function extractTitle(html: string): string {
  const m = html.match(/<h1>([^<]+)<\/h1>/);
  return m ? m[1].trim() : "";
}

/** Дата первого дня недели из таблицы расписания (для определения недели) */
export function extractFirstDate(html: string): string | null {
  const re = /(\d{2}\.\d{2}\.\d{4})\s*<br>\s*(Пн|Вт|Ср|Чт|Пт|Сб|Вс)/g;
  let earliest: string | null = null;
  for (const m of html.matchAll(re)) {
    const iso = parseRuDate(m[1]);
    if (iso && (earliest === null || iso < earliest)) earliest = iso;
  }
  return earliest;
}

/**
 * Свежее ли расписание источника по сравнению с меткой из нашего снапшота.
 * Сравниваем строку «Обновлено» (дата+время).
 */
export function isSourceNewer(sourceHtml: string, snapshotUpdatedAt: string): boolean {
  const srcISO = extractUpdatedAtISO(sourceHtml);
  if (!srcISO) return false;
  if (!snapshotUpdatedAt) return true;
  // snapshotUpdatedAt хранится в том же формате «dd.mm.yyyy в HH:MM»
  const m = snapshotUpdatedAt.match(/(\d{2})\.(\d{2})\.(\d{4})\s*в\s*(\d{2}):(\d{2})/);
  if (!m) return true;
  const snapISO = `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`;
  return srcISO > snapISO;
}
