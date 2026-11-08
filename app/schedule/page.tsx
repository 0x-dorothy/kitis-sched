"use client";

// Расписание: выбор сущности, навигация по неделям, вид «список» / «доска».

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EntityPicker } from "@/components/entity-picker";
import { ScheduleView } from "@/components/schedule-view";
import { FavoriteStar } from "@/components/favorite-star";
import type { Directory, ScheduleResponse, ScheduleType } from "@/lib/types";
import { SCHEDULE_TYPES } from "@/lib/types";
import { addDays, currentWeekStart, weekRange, weekRelationLabel } from "@/lib/weeks";
import { IconChevronLeft, IconChevronRight, IconGrid, IconList } from "@/components/icons";

type View = "list" | "board";

function titleText(schedule: ScheduleResponse["schedule"]): string {
  const parts = schedule.title.split(":");
  return (parts[1] ?? parts[0]).trim() || schedule.id;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 py-4" aria-label="Загрузка расписания">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4" style={{ opacity: 1 - i * 0.12 }}>
          <div className="h-3 w-12 rounded" style={{ background: "var(--surface-2)" }} />
          <div className="h-3 rounded" style={{ background: "var(--surface-2)", width: `${58 - i * 6}%` }} />
        </div>
      ))}
    </div>
  );
}

function SchedulePageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const type = (["group", "teacher", "room"].includes(params.get("type") ?? "")
    ? params.get("type")
    : "group") as ScheduleType;
  const id = params.get("id") ?? (type === "group" ? "cg95" : type === "teacher" ? "cp131" : "ca106");
  const week = params.get("week") ?? "";

  const [dir, setDir] = useState<Directory | null>(null);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("board");

  useEffect(() => {
    const saved = localStorage.getItem("sched-view") as View | null;
    const mq = window.matchMedia("(max-width: 767px)");
    setView(saved ?? (mq.matches ? "list" : "board"));
  }, []);

  const changeView = (v: View) => {
    setView(v);
    localStorage.setItem("sched-view", v);
  };

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDir(d))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/schedule?type=${type}&id=${id}${week ? `&week=${week}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Не удалось загрузить расписание");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [type, id, week]);

  useEffect(() => {
    void load();
  }, [load]);

  const navigate = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.push(`/schedule?${next.toString()}`);
    },
    [params, router]
  );

  const schedule = data?.schedule;
  const liveWeek = schedule?.weekStart ?? "";
  const showingWeek = week || liveWeek;
  const prevWeek = showingWeek ? addDays(showingWeek, -7) : "";
  const nextWeek = showingWeek ? addDays(showingWeek, 7) : "";
  const isCurrentWeek = showingWeek === currentWeekStart();
  const typeLabel = SCHEDULE_TYPES.find((t) => t.value === type)?.label ?? "";

  return (
    <div className="flex flex-col gap-4">
      <EntityPicker
        type={type}
        directory={dir}
        value={id}
        onPick={(t, nextId) => navigate({ type: t, id: nextId, week: null })}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="tag">{typeLabel}</span>
        <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-tight md:text-[22px]">
          {schedule ? titleText(schedule) : "…"}
        </h1>
        {schedule && <FavoriteStar type={type} id={id} label={titleText(schedule)} />}
        {data?.archived && <span className="tag">архив</span>}
        {schedule?.updatedAt && (
          <span className="mono ml-auto hidden text-[11px] md:inline" style={{ color: "var(--faint)" }}>
            обновлено {schedule.updatedAt}
          </span>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-1">
          <button
            className="icon-btn"
            onClick={() => navigate({ week: prevWeek })}
            disabled={!showingWeek}
            aria-label="Прошлая неделя"
            title="Прошлая неделя"
          >
            <IconChevronLeft size={17} />
          </button>
          <button
            className="icon-btn"
            onClick={() => navigate({ week: nextWeek })}
            disabled={!showingWeek}
            aria-label="Следующая неделя"
            title="Следующая неделя"
          >
            <IconChevronRight size={17} />
          </button>
        </div>

        <div className="min-w-0">
          <div className="text-[13.5px] font-bold leading-tight">
            {showingWeek ? weekRange(showingWeek) : "—"}
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--faint)" }}>
            {showingWeek ? weekRelationLabel(showingWeek) : "загрузка"}
          </div>
        </div>

        {!isCurrentWeek && showingWeek && (
          <button className="btn btn-sm" onClick={() => navigate({ week: null })}>
            К текущей
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="seg" role="tablist" aria-label="Вид расписания">
            <button
              className={`seg-btn flex items-center gap-1.5 ${view === "list" ? "is-active" : ""}`}
              onClick={() => changeView("list")}
              aria-selected={view === "list"}
              role="tab"
            >
              <IconList size={13} /> Список
            </button>
            <button
              className={`seg-btn flex items-center gap-1.5 ${view === "board" ? "is-active" : ""}`}
              onClick={() => changeView("board")}
              aria-selected={view === "board"}
              role="tab"
            >
              <IconGrid size={13} /> Доска
            </button>
          </div>
        </div>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="panel p-5">
          <p className="m-0 text-[13.5px] font-semibold" style={{ color: "var(--warn)" }}>
            {error}
          </p>
          <p className="m-0 mt-1.5 text-[12px]" style={{ color: "var(--muted)" }}>
            Прошлые недели хранятся в архиве и появляются после подключения базы данных
            (инструкция в README). Текущая неделя всегда доступна с сайта колледжа.
          </p>
        </div>
      )}

      {!loading && schedule && <ScheduleView schedule={schedule} view={view} />}

      {!loading && schedule && schedule.days.length === 0 && (
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          На эту неделю занятий нет.
        </p>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SchedulePageInner />
    </Suspense>
  );
}
