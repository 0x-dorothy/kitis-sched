// Общие типы приложения и данных расписания

export type ScheduleType = "group" | "teacher" | "room";

export const SCHEDULE_TYPES: { value: ScheduleType; label: string; labelPlural: string }[] = [
  { value: "group", label: "Группа", labelPlural: "Группы" },
  { value: "teacher", label: "Преподаватель", labelPlural: "Преподаватели" },
  { value: "room", label: "Аудитория", labelPlural: "Аудитории" },
];

/** Ссылка на сущность расписания: id вида cg95 / cp131 / ca106 */
export interface EntityRef {
  id: string; // "cg95"
  name: string; // "ИСр24-1" / "Шевченко П.С." / "203"
}

/** Одно занятие (для подгрупп в одной паре ячеек может быть несколько) */
export interface Lesson {
  pair: number; // 1..7
  subject: string;
  groups: EntityRef[]; // группы (в представлении преподавателя/аудитории)
  teacher?: EntityRef; // в представлении группы/аудитории
  room?: EntityRef; // в представлении группы/преподавателя
  subgroups: number[]; // [1,2] — вся группа; [1] или [2] — подгруппа
}

export interface DaySchedule {
  date: string; // ISO yyyy-mm-dd
  weekday: number; // 1 = Пн … 7 = Вс
  lessons: Record<number, Lesson[]>; // ключ — номер пары (1..7)
}

export interface WeekSchedule {
  type: ScheduleType;
  id: string;
  title: string; // «Группа ИСр24-1»
  weekStart: string; // ISO понедельник
  updatedAt: string; // метка «Обновлено» с источника
  days: DaySchedule[];
}

export interface Directory {
  groups: EntityRef[];
  teachers: EntityRef[];
  rooms: EntityRef[];
}

export interface WeekMeta {
  weekStart: string; // ISO понедельник
  fetchedAt?: string;
}

export interface ScheduleResponse {
  schedule: WeekSchedule;
  /** Недели, доступные в архиве для этой сущности (требуется БД) */
  availableWeeks: WeekMeta[];
  /** true — данные из архива, false — живой парсинг источника */
  archived: boolean;
}
