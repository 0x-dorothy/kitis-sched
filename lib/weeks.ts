// Работа с учебными неделями (неделя = Пн…Вс).
// Часовой пояс колледжа — Europe/Kaliningrad (UTC+2): сервер видит «сегодня» так же, как студенты.

export const COLLEGE_TZ = "Europe/Kaliningrad";

/** «Сегодня» в таймзоне колледжа в формате yyyy-mm-dd */
export function todayISO(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLLEGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/** День недели (1=Пн…7=Вс) для ISO-даты */
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Понедельник недели, содержащей ISO-дату */
export function mondayOf(isoDate: string): string {
  const dow = weekdayOf(isoDate);
  return addDays(isoDate, -(dow - 1));
}

export function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + delta * 86400000);
  return dt.toISOString().slice(0, 10);
}

/** Понедельник текущей недели (по часам колледжа) */
export function currentWeekStart(): string {
  return mondayOf(todayISO());
}

/** «09.11.2026» → «2026-11-09» */
export function parseRuDate(s: string): string | null {
  const m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** «2026-11-09» → «9 ноября» */
export function formatDayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  return `${d} ${months[m - 1]}`;
}

/** «2026-11-09» → «09.11.2026» */
export function formatRuDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

/** «2026-11-09» → «2026-11-15» диапазон недели */
export function weekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const [, m1, d1] = weekStart.split("-").map(Number);
  const [, m2, d2] = end.split("-").map(Number);
  if (m1 === m2) return `${d1}–${d2} ${monthGen(m1)}`;
  return `${d1} ${monthGen(m1)} – ${d2} ${monthGen(m2)}`;
}

function monthGen(m: number): string {
  return [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ][m - 1];
}

/** Приблизительная надпись: «Текущая неделя», «Неделя +1», «2 недели назад» и т.п. */
export function weekRelationLabel(weekStart: string): string {
  const cur = currentWeekStart();
  if (weekStart === cur) return "Текущая неделя";
  const [y1, m1, d1] = cur.split("-").map(Number);
  const [y2, m2, d2] = weekStart.split("-").map(Number);
  const diffDays = Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000
  );
  const weeks = Math.round(diffDays / 7);
  if (weeks > 0) return weeks === 1 ? "Следующая неделя" : `Через ${weeks} нед.`;
  const abs = -weeks;
  return abs === 1 ? "Прошлая неделя" : `${abs} нед. назад`;
}
