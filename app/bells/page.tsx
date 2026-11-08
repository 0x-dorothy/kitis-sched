"use client";

// Расписание звонков: понедельник (кураторский день) и вт–сб,
// с подсветкой текущей пары и прогрессом.

import { MAIN_SLOTS, MONDAY_SLOTS, WEEKDAY_FULL } from "@/lib/bells";
import { useNow } from "@/lib/use-now";

function SlotTable({
  title,
  subtitle,
  slots,
  isToday,
  nowPair,
  progress,
}: {
  title: string;
  subtitle: string;
  slots: { pair: number; start: string; end: string; note?: string }[];
  isToday: boolean;
  nowPair: number | null;
  progress?: number;
}) {
  return (
    <section className="panel overflow-hidden">
      <header
        className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline gap-2">
          <h2 className="m-0 text-[14px] font-bold">{title}</h2>
          {isToday && <span className="tag tag-accent">сегодня</span>}
        </div>
        <span className="text-[11px] leading-tight" style={{ color: "var(--faint)" }}>
          {subtitle}
        </span>
      </header>

      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="text-left" style={{ color: "var(--faint)" }}>
            <th className="w-14 px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider">Пара</th>
            <th className="px-2 py-2 text-[10.5px] font-bold uppercase tracking-wider">Начало</th>
            <th className="px-2 py-2 text-[10.5px] font-bold uppercase tracking-wider">Конец</th>
            <th className="px-4 py-2 text-right text-[10.5px] font-bold uppercase tracking-wider">Длительность</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => {
            const active = isToday && nowPair === s.pair;
            const [sh, sm] = s.start.split(":").map(Number);
            const [eh, em] = s.end.split(":").map(Number);
            const minutes = eh * 60 + em - (sh * 60 + sm);
            return (
              <tr
                key={s.pair}
                style={{
                  borderTop: "1px solid var(--border)",
                  background: active ? "var(--accent-soft)" : undefined,
                }}
              >
                <td
                  className="mono px-4 py-2 font-semibold"
                  style={{ color: active ? "var(--accent)" : "var(--text)" }}
                >
                  {s.pair}
                </td>
                <td className="mono px-2 py-2">{s.start}</td>
                <td className="mono px-2 py-2">{s.end}</td>
                <td className="mono px-4 py-2 text-right" style={{ color: "var(--faint)" }}>
                  {minutes} мин
                </td>
              </tr>
            );
          })}
          {isToday && nowPair !== null && progress !== undefined && (
            <tr>
              <td colSpan={4} className="p-0">
                <div className="h-0.5 w-full" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${Math.round(progress * 100)}%`, background: "var(--accent)" }}
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {slots.some((s) => s.note) && (
        <div
          className="flex flex-col gap-1 px-4 py-2.5 text-[11.5px] leading-relaxed"
          style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
        >
          {slots
            .filter((s) => s.note)
            .map((s) => (
              <span key={s.pair}>{s.note}</span>
            ))}
        </div>
      )}
    </section>
  );
}

export default function BellsPage() {
  const { status, todayWeekday } = useNow(5000);
  const nowPair = status.kind === "pair" ? status.pair : null;
  const progress = status.kind === "pair" ? status.progress : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="h-page m-0">Расписание звонков</h1>
        <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
          {WEEKDAY_FULL[todayWeekday - 1]} · утверждённое расписание колледжа
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SlotTable
          title="Понедельник"
          subtitle="кураторский день"
          slots={MONDAY_SLOTS}
          isToday={todayWeekday === 1}
          nowPair={nowPair}
          progress={progress}
        />
        <SlotTable
          title="Вторник — суббота"
          subtitle="основное расписание"
          slots={MAIN_SLOTS}
          isToday={todayWeekday >= 2 && todayWeekday <= 6}
          nowPair={nowPair}
          progress={progress}
        />
      </div>

      <p className="m-0 text-[11.5px]" style={{ color: "var(--faint)" }}>
        Воскресенье — выходной. Перед 6-й парой в понедельник — «Разговоры о важном» / кураторский час.
      </p>
    </div>
  );
}
