"use client";

// Компактный таймер «сейчас»: до конца пары, до начала, перемена, выходной.
// Всегда виден в шапке — независимо от того, какая неделя открыта.

import { useEffect, useState } from "react";
import { getNowStatus } from "@/lib/bells";

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function parseHM(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

function secondsUntil(hm: string, now: Date): number {
  const { h, m } = parseHM(hm);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
}

export function StatusPill({ showLabel = true }: { showLabel?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <span className="status-strip" style={{ opacity: 0.4 }} aria-hidden>— — —</span>;
  }

  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const status = getNowStatus(weekday, minutes);

  switch (status.kind) {
    case "pair": {
      const left = secondsUntil(status.endsAt, now);
      return (
        <span className="status-strip" title={`${status.pair}-я пара · до ${status.endsAt}`}>
          <span className="dot dot-pulse" />
          {showLabel && <span>до конца пары</span>}
          <b className="mono">
            {pad(Math.floor(left / 60))}:{pad(left % 60)}
          </b>
        </span>
      );
    }
    case "break": {
      const left = secondsUntil(status.startsAt, now);
      return (
        <span className="status-strip" title={`${status.nextPair}-я пара в ${status.startsAt}`}>
          <span className="dot" style={{ background: "var(--muted)" }} />
          {showLabel && <span>перемена</span>}
          <b className="mono">
            {pad(Math.floor(left / 60))}:{pad(left % 60)}
          </b>
        </span>
      );
    }
    case "before":
      return (
        <span className="status-strip" title={`Первая пара в ${status.startsAt}`}>
          <span className="dot" style={{ background: "var(--muted)" }} />
          {showLabel && <span>занятия в</span>}
          <b className="mono">{status.startsAt}</b>
        </span>
      );
    case "after":
      return (
        <span className="status-strip" title="Занятия на сегодня закончились">
          <span className="dot" style={{ background: "var(--faint)" }} />
          {showLabel && <span>занятия завершены</span>}
        </span>
      );
    case "weekend":
      return (
        <span className="status-strip" title="Воскресенье — выходной">
          <span className="dot" style={{ background: "var(--faint)" }} />
          {showLabel && <span>выходной</span>}
        </span>
      );
  }
}

/** Строка «сегодня» для страниц: день недели + статус + примечание */
export function TodayStrip() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const status = getNowStatus(weekday, minutes);
  const names = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      <span className="overline">{names[weekday - 1]}</span>
      {status.kind === "pair" && (
        <span style={{ color: "var(--muted)" }}>
          идёт <b style={{ color: "var(--text)" }}>{status.pair}-я пара</b>, до {status.endsAt}
        </span>
      )}
      {status.kind === "break" && (
        <span style={{ color: "var(--muted)" }}>
          перемена, {status.nextPair}-я пара в {status.startsAt}
        </span>
      )}
      {status.kind === "before" && (
        <span style={{ color: "var(--muted)" }}>
          занятия начинаются в {status.startsAt}
        </span>
      )}
      {status.kind === "after" && <span style={{ color: "var(--muted)" }}>занятия завершены</span>}
      {status.kind === "weekend" && <span style={{ color: "var(--muted)" }}>выходной</span>}
    </div>
  );
}
