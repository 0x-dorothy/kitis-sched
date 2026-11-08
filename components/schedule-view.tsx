"use client";

// Расписание в двух видах: «доска» (недельная сетка) и «список» (в столбик по дням).

import Link from "next/link";
import type { Lesson, WeekSchedule } from "@/lib/types";
import { slotsForWeekday, WEEKDAY_LABELS, WEEKDAY_FULL } from "@/lib/bells";
import { formatDayMonth, formatRuDate } from "@/lib/weeks";
import { useNow } from "@/lib/use-now";

function MetaLink({ kind, id, name }: { kind: "room" | "teacher" | "group"; id: string; name: string }) {
  return (
    <Link className="meta-link" data-kind={kind} href={`/schedule?type=${kind}&id=${id}`}>
      {name}
    </Link>
  );
}

function LessonBody({ lesson, weekday, pair, isNow, showGroups }: {
  lesson: Lesson;
  weekday: number;
  pair: number;
  isNow: boolean;
  showGroups: boolean;
}) {
  const slot = slotsForWeekday(weekday).find((s) => s.pair === pair);
  const subgroup =
    lesson.subgroups.length === 1 ? `${lesson.subgroups[0]} п/г` : null;

  return (
    <div className={`lesson ${isNow ? "lesson-now" : ""}`}>
      <div className="lesson-subject">
        {lesson.subject}
        {subgroup && (
          <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--faint)" }}>
            {subgroup}
          </span>
        )}
      </div>
      <div className="lesson-meta">
        {slot && <span className="mono">{slot.start}–{slot.end}</span>}
        {lesson.room && <MetaLink kind="room" id={lesson.room.id} name={lesson.room.name} />}
        {lesson.teacher && <MetaLink kind="teacher" id={lesson.teacher.id} name={lesson.teacher.name} />}
        {showGroups && lesson.groups.map((g) => <MetaLink key={g.id} kind="group" id={g.id} name={g.name} />)}
      </div>
    </div>
  );
}

export function ScheduleView({ schedule, view }: { schedule: WeekSchedule; view: "board" | "list" }) {
  const { todayWeekday } = useNow(60000);
  const { status } = useNow(15000);
  const showGroups = schedule.type !== "group";

  const visibleDays = schedule.days.filter(
    (d) => d.weekday !== 7 || Object.keys(d.lessons).length > 0
  );

  const maxPair = Math.max(
    6,
    ...visibleDays.flatMap((d) => Object.keys(d.lessons).map(Number))
  );

  /* ---------- Список ---------- */
  if (view === "list") {
    return (
      <div className="flex flex-col">
        {visibleDays.map((day, dayIndex) => {
          const isToday = day.weekday === todayWeekday;
          const slots = slotsForWeekday(day.weekday);
          const pairs = Object.keys(day.lessons).map(Number).sort((a, b) => a - b);

          return (
            <section
              key={day.date}
              className="rise"
              style={{
                borderTop: dayIndex === 0 ? "1px solid var(--border)" : "1px solid var(--border)",
                animationDelay: `${dayIndex * 18}ms`,
              }}
            >
              <header className="flex items-baseline gap-3 py-3">
                <h2 className="m-0 text-[13.5px] font-bold">{WEEKDAY_FULL[day.weekday - 1]}</h2>
                <span className="mono text-[12px]" style={{ color: "var(--faint)" }}>
                  {formatRuDate(day.date)}
                </span>
                {isToday && (
                  <span className="tag tag-accent">
                    <span className="dot dot-pulse" style={{ width: 4, height: 4 }} />
                    сегодня
                  </span>
                )}
              </header>

              {pairs.length === 0 ? (
                <p className="-mt-1 pb-4 text-[12.5px]" style={{ color: "var(--faint)" }}>
                  Занятий нет
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {pairs.map((pair) => {
                    const slot = slots.find((s) => s.pair === pair);
                    const lessons = day.lessons[pair] ?? [];
                    const isNow = isToday && status.kind === "pair" && status.pair === pair;
                    return (
                      <li
                        key={pair}
                        className="grid grid-cols-[16px_78px_1fr] items-baseline gap-3 py-2.5 sm:grid-cols-[20px_86px_1fr]"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <span
                          className="mono text-[11.5px] font-semibold"
                          style={{ color: isNow ? "var(--accent)" : "var(--faint)" }}
                          title="Пара"
                        >
                          {pair}
                        </span>
                        <span className="mono text-[11.5px]" style={{ color: isNow ? "var(--accent)" : "var(--muted)" }}>
                          {slot ? `${slot.start}–${slot.end}` : ""}
                        </span>
                        <div className="flex flex-col gap-2">
                          {lessons.map((l, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                              <span className="text-[13.5px] font-semibold leading-snug">{l.subject}</span>
                              <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
                                {l.room && <MetaLink kind="room" id={l.room.id} name={l.room.name} />}
                                {l.teacher && <MetaLink kind="teacher" id={l.teacher.id} name={l.teacher.name} />}
                                {showGroups && l.groups.map((g) => <MetaLink key={g.id} kind="group" id={g.id} name={g.name} />)}
                                {l.subgroups.length === 1 && (
                                  <span style={{ color: "var(--faint)" }}>{l.subgroups[0]} п/г</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  /* ---------- Доска ---------- */
  const cols = `54px repeat(${visibleDays.length}, minmax(148px, 1fr))`;

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <div style={{ minWidth: 700 }}>
        {/* Шапка дней */}
        <div className="grid" style={{ gridTemplateColumns: cols }}>
          <div />
          {visibleDays.map((day) => {
            const isToday = day.weekday === todayWeekday;
            return (
              <div
                key={day.date}
                className="px-2.5 pb-2 pt-3"
                style={{ borderLeft: "1px solid var(--border)" }}
              >
                <div
                  className="text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: isToday ? "var(--accent)" : "var(--muted)" }}
                >
                  {WEEKDAY_LABELS[day.weekday - 1]}
                </div>
                <div className="mono mt-0.5 text-[11px]" style={{ color: "var(--faint)" }}>
                  {formatDayMonth(day.date)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Строки пар */}
        {Array.from({ length: maxPair }, (_, i) => i + 1).map((pair) => (
          <div key={pair} className="grid" style={{ gridTemplateColumns: cols }}>
            <div
              className="flex flex-col items-center justify-start pt-2.5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span className="mono text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}>
                {pair}
              </span>
            </div>
            {visibleDays.map((day) => {
              const lessons = day.lessons[pair] ?? [];
              const isNow =
                day.weekday === todayWeekday && status.kind === "pair" && status.pair === pair;
              return (
                <div
                  key={`${day.date}-${pair}`}
                  className="flex flex-col"
                  style={{ borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}
                >
                  {lessons.length === 0 ? (
                    <div className="min-h-[46px] flex-1" />
                  ) : (
                    lessons.map((l, i) => (
                      <LessonBody
                        key={i}
                        lesson={l}
                        weekday={day.weekday}
                        pair={pair}
                        isNow={isNow}
                        showGroups={showGroups}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
