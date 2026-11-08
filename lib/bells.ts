// Расписание звонков ГБУ КО ПОО «КИТиС»
// Источник: images/bell_shedule.png на сайте расписания (утв. 29.08.2025).
// Понедельник — кураторский день (своё расписание), вторник–суббота — основное.

export interface PairSlot {
  pair: number;
  start: string; // "HH:MM"
  end: string;
  note?: string; // особенность слота
}

// Понедельник (кураторский день)
export const MONDAY_SLOTS: PairSlot[] = [
  { pair: 1, start: "08:30", end: "09:00", note: "Разговоры о важном / кураторский час (подъём флага в 08:15)" },
  { pair: 2, start: "09:10", end: "10:30" },
  { pair: 3, start: "10:40", end: "12:00" },
  { pair: 4, start: "12:20", end: "13:40" },
  { pair: 5, start: "13:50", end: "15:10" },
  { pair: 6, start: "16:00", end: "17:20", note: "Перед 6-й парой: 15:20–15:50 — Разговоры о важном / кураторский час" },
  { pair: 7, start: "17:30", end: "18:50" },
];

// Вторник–суббота (основное расписание)
export const MAIN_SLOTS: PairSlot[] = [
  { pair: 1, start: "08:30", end: "10:00" },
  { pair: 2, start: "10:10", end: "11:40" },
  { pair: 3, start: "12:10", end: "13:40" },
  { pair: 4, start: "13:50", end: "15:20" },
  { pair: 5, start: "15:30", end: "17:00" },
  { pair: 6, start: "17:10", end: "18:40" },
];

export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAY_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export function slotsForWeekday(weekday: number): PairSlot[] {
  return weekday === 1 ? MONDAY_SLOTS : MAIN_SLOTS;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export type NowStatus =
  | { kind: "before"; nextPair: number; startsInMin: number; startsAt: string }
  | { kind: "pair"; pair: number; endsAt: string; leftMin: number; progress: number; note?: string }
  | { kind: "break"; nextPair: number; startsInMin: number; startsAt: string; prevPair: number }
  | { kind: "after" }
  | { kind: "weekend" };

/** Статус «сейчас» по звонкам для заданного дня недели и времени (минуты с полуночи). */
export function getNowStatus(weekday: number, minutes: number): NowStatus {
  if (weekday === 7) return { kind: "weekend" };
  const slots = slotsForWeekday(weekday);
  const first = slots[0];
  const last = slots[slots.length - 1];
  if (minutes < toMinutes(first.start)) {
    return {
      kind: "before",
      nextPair: first.pair,
      startsInMin: toMinutes(first.start) - minutes,
      startsAt: first.start,
    };
  }
  if (minutes >= toMinutes(last.end)) return { kind: "after" };

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const startM = toMinutes(s.start);
    const endM = toMinutes(s.end);
    if (minutes >= startM && minutes < endM) {
      return {
        kind: "pair",
        pair: s.pair,
        endsAt: s.end,
        leftMin: endM - minutes,
        progress: (minutes - startM) / (endM - startM),
        note: s.note,
      };
    }
    const next = slots[i + 1];
    if (next && minutes >= endM && minutes < toMinutes(next.start)) {
      return {
        kind: "break",
        prevPair: s.pair,
        nextPair: next.pair,
        startsInMin: toMinutes(next.start) - minutes,
        startsAt: next.start,
      };
    }
  }
  return { kind: "after" };
}
