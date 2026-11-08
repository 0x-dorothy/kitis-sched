"use client";

// Сравнение до 4 расписаний: единая таблица «день × пара», равные колонки,
// горизонтальная прокрутка на узких экранах.

import { useCallback, useEffect, useMemo, useState } from "react";
import { EntityPicker } from "@/components/entity-picker";
import type { Directory, ScheduleType, WeekSchedule } from "@/lib/types";
import { SCHEDULE_TYPES } from "@/lib/types";
import { slotsForWeekday, WEEKDAY_LABELS } from "@/lib/bells";
import { currentWeekStart, formatRuDate, weekRange } from "@/lib/weeks";
import { fetchDirectory, fetchSchedule, type DirectoryData } from "@/lib/data-client";
import { IconX } from "@/components/icons";

interface Column {
  type: ScheduleType;
  id: string;
}

const MAX = 4;
const STORE_KEY = "compare-columns-v2";

function loadColumns(): Column[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Column[];
      if (Array.isArray(parsed)) return parsed.slice(0, MAX);
    }
  } catch {}
  return [{ type: "group", id: "cg95" }];
}

export default function ComparePage() {
  const [dir, setDir] = useState<DirectoryData | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [schedules, setSchedules] = useState<Record<string, WeekSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [pickerType, setPickerType] = useState<ScheduleType>("group");

  useEffect(() => {
    setColumns(loadColumns());
  }, []);

  useEffect(() => {
    if (columns.length) localStorage.setItem(STORE_KEY, JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    fetchDirectory()
      .then(setDir)
      .catch(() => {});
  }, []);

  const loadAll = useCallback(async (cols: Column[]) => {
    if (cols.length === 0) {
      setSchedules({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const results: Record<string, WeekSchedule> = {};
    await Promise.all(
      cols.map(async (c) => {
        try {
          const json = await fetchSchedule(c.type, c.id);
          results[c.id] = json.schedule;
        } catch {}
      })
    );
    setSchedules(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (columns.length === 0) return;
    void loadAll(columns);
  }, [columns, loadAll]);

  const nameOf = (c: Column): string => {
    const s = schedules[c.id];
    if (s) {
      const parts = s.title.split(":");
      return (parts[1] ?? parts[0]).trim();
    }
    const list = dir
      ? c.type === "group"
        ? dir.groups
        : c.type === "teacher"
          ? dir.teachers
          : dir.rooms
      : [];
    return list.find((e) => e.id === c.id)?.name ?? c.id;
  };

  const addColumn = (type: ScheduleType, id: string) => {
    setPickerType(type);
    setColumns((prev) => (prev.some((c) => c.id === id) || prev.length >= MAX ? prev : [...prev, { type, id }]));
  };

  const removeColumn = (id: string) => setColumns((prev) => prev.filter((c) => c.id !== id));

  const weekStart = useMemo(() => {
    const first = Object.values(schedules)[0];
    return first?.weekStart ?? currentWeekStart();
  }, [schedules]);

  const days = useMemo(() => {
    const base = Object.values(schedules)[0]?.days ?? [];
    return base.filter((d) => d.weekday !== 7);
  }, [schedules]);

  const cols = `46px repeat(${Math.max(columns.length, 1)}, minmax(168px, 1fr))`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="h-page m-0">Сравнение</h1>
          <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
            До четырёх групп, преподавателей или аудиторий — рядом, по дням и парам. {weekRange(weekStart)}
          </p>
        </div>
        {columns.length > 0 && (
          <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
            {columns.length}/{MAX}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {dir && columns.length < MAX && (
          <EntityPicker
            type={pickerType}
            directory={dir}
            value=""
            onPick={addColumn}
          />
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {columns.map((c) => (
            <span
              key={c.id}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border pl-2.5 pr-1 text-[12.5px] font-semibold"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--faint)" }}>
                {SCHEDULE_TYPES.find((t) => t.value === c.type)?.label}
              </span>
              {nameOf(c)}
              <button
                className="icon-btn"
                style={{ width: 22, height: 22 }}
                onClick={() => removeColumn(c.id)}
                aria-label={`Убрать ${nameOf(c)}`}
                title="Убрать"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
          {columns.length === 0 && (
            <span className="text-[12.5px]" style={{ color: "var(--faint)" }}>
              Добавьте хотя бы одно расписание
            </span>
          )}
        </div>
      </div>

      {columns.length === 0 && (
        <div
          className="grid place-items-center rounded-lg border border-dashed px-6 py-14 text-center"
          style={{ borderColor: "var(--border-strong)" }}
        >
          <p className="m-0 max-w-sm text-[13px]" style={{ color: "var(--muted)" }}>
            Выберите группу, преподавателя или аудиторию выше — и они появятся в общей таблице рядом.
          </p>
        </div>
      )}

      {columns.length > 0 && loading && (
        <div className="flex flex-col gap-2 py-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 rounded" style={{ background: "var(--surface-2)", width: `${70 - i * 8}%` }} />
          ))}
        </div>
      )}

      {columns.length > 0 && !loading && days.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div style={{ minWidth: 46 + columns.length * 168 }}>
            {/* Заголовок колонок */}
            <div className="grid" style={{ gridTemplateColumns: cols }}>
              <div />
              {columns.map((c) => (
                <div
                  key={c.id}
                  className="px-2.5 pb-2 pt-1"
                  style={{ borderLeft: "1px solid var(--border)" }}
                >
                  <div className="truncate text-[12.5px] font-bold" title={nameOf(c)}>
                    {nameOf(c)}
                  </div>
                  <div className="text-[10.5px] uppercase tracking-wide" style={{ color: "var(--faint)" }}>
                    {SCHEDULE_TYPES.find((t) => t.value === c.type)?.label}
                  </div>
                </div>
              ))}
            </div>

            {days.map((day) => {
              const slots = slotsForWeekday(day.weekday);
              const pairs = Array.from(
                new Set([
                  ...slots.map((s) => s.pair),
                  ...columns.flatMap((c) =>
                    Object.keys(schedules[c.id]?.days.find((d) => d.date === day.date)?.lessons ?? {}).map(Number)
                  ),
                ])
              ).sort((a, b) => a - b);

              const hasAny = columns.some((c) => {
                const d = schedules[c.id]?.days.find((x) => x.date === day.date);
                return d && Object.keys(d.lessons).length > 0;
              });

              return (
                <div key={day.date}>
                  <div
                    className="flex items-baseline gap-2.5 py-2"
                    style={{ borderTop: "1px solid var(--border-strong)" }}
                  >
                    <span className="text-[12.5px] font-bold">{WEEKDAY_LABELS[day.weekday - 1]}</span>
                    <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
                      {formatRuDate(day.date)}
                    </span>
                    {!hasAny && (
                      <span className="text-[11.5px]" style={{ color: "var(--faint)" }}>
                        занятий нет
                      </span>
                    )}
                  </div>

                  {hasAny &&
                    pairs.map((pair) => (
                      <div key={pair} className="grid" style={{ gridTemplateColumns: cols }}>
                        <div
                          className="mono flex items-start justify-center pt-2 text-[11.5px] font-semibold"
                          style={{ borderTop: "1px solid var(--border)", color: "var(--faint)" }}
                        >
                          {pair}
                        </div>
                        {columns.map((c) => {
                          const d = schedules[c.id]?.days.find((x) => x.date === day.date);
                          const lessons = d?.lessons[pair] ?? [];
                          return (
                            <div
                              key={c.id}
                              className="min-h-[46px] px-2.5 py-2"
                              style={{ borderTop: "1px solid var(--border)", borderLeft: "1px solid var(--border)" }}
                            >
                              {lessons.length === 0 ? (
                                <span className="text-[12px]" style={{ color: "var(--faint)" }}>
                                  —
                                </span>
                              ) : (
                                lessons.map((l, i) => (
                                  <div key={i} className={i > 0 ? "mt-1.5" : ""}>
                                    <div className="text-[12.5px] font-semibold leading-snug">{l.subject}</div>
                                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]" style={{ color: "var(--muted)" }}>
                                      {l.room && <span>{l.room.name}</span>}
                                      {l.teacher && <span>{l.teacher.name}</span>}
                                      {l.groups.map((g) => (
                                        <span key={g.id}>{g.name}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {columns.length > 0 && !loading && days.length === 0 && (
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Не удалось получить расписание для выбранных элементов.
        </p>
      )}
    </div>
  );
}
