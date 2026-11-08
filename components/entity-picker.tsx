"use client";

// Выбор сущности: тип (группа / преподаватель / аудитория) + поиск по списку.
// Один обработчик onPick(type, id) — вкладка и данные всегда синхронны.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Directory, EntityRef, ScheduleType } from "@/lib/types";
import { SCHEDULE_TYPES } from "@/lib/types";
import { IconChevronDown, IconSearch } from "./icons";

const FALLBACK_ID: Record<ScheduleType, string> = { group: "cg95", teacher: "cp131", room: "ca106" };

export function EntityPicker({
  type,
  directory,
  value,
  onPick,
}: {
  type: ScheduleType;
  directory: Directory | null;
  value: string;
  onPick: (type: ScheduleType, id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: EntityRef[] = directory
    ? type === "group"
      ? directory.groups
      : type === "teacher"
        ? directory.teachers
        : directory.rooms
    : [];

  const selected = items.find((i) => i.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
    return list.slice(0, 120);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (item: EntityRef) => {
    onPick(type, item.id);
    setOpen(false);
    setQuery("");
  };

  const switchType = (next: ScheduleType) => {
    if (next === type) return;
    const list = directory
      ? next === "group"
        ? directory.groups
        : next === "teacher"
          ? directory.teachers
          : directory.rooms
      : [];
    const fallback = FALLBACK_ID[next];
    const target = list.find((i) => i.id === fallback) ?? list[0];
    onPick(next, target?.id ?? fallback);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div
        className="flex shrink-0 rounded-lg border p-0.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        role="tablist"
        aria-label="Тип расписания"
      >
        {SCHEDULE_TYPES.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              className="h-7 whitespace-nowrap rounded-md px-2.5 text-[12.5px] font-semibold transition-colors"
              style={
                active
                  ? { background: "var(--accent)", color: "var(--accent-ink)" }
                  : { color: "var(--muted)" }
              }
              onClick={() => switchType(t.value)}
            >
              {t.labelPlural}
            </button>
          );
        })}
      </div>

      <div ref={boxRef} className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--faint)" }}>
          <IconSearch size={14} />
        </span>
        <input
          ref={inputRef}
          className="input pl-8 pr-18"
          placeholder={`Найти: ${SCHEDULE_TYPES.find((t) => t.value === type)?.label.toLowerCase()}…`}
          value={open ? query : selected?.name ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter" && filtered[highlight]) {
              e.preventDefault();
              choose(filtered[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          aria-label="Поиск по списку"
          aria-expanded={open}
          role="combobox"
          aria-controls="entity-listbox"
        />
        {!open && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={{ color: "var(--faint)" }}
            onClick={() => {
              inputRef.current?.focus();
              setOpen(true);
              setQuery("");
            }}
            aria-label="Открыть список"
            tabIndex={-1}
          >
            <IconChevronDown size={14} />
          </button>
        )}

        {open && (
          <div
            id="entity-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-[38px] z-40 max-h-72 overflow-y-auto rounded-xl border p-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pop)" }}
          >
            {filtered.length === 0 && (
              <div className="px-2.5 py-3 text-[13px]" style={{ color: "var(--muted)" }}>
                Ничего не найдено
              </div>
            )}
            {filtered.map((item, i) => (
              <button
                key={item.id}
                role="option"
                aria-selected={item.id === value}
                className="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium"
                style={{
                  background: i === highlight ? "var(--surface-2)" : "transparent",
                  color: item.id === value ? "var(--accent)" : "var(--text)",
                }}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
