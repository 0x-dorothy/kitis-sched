"use client";

// Главная: статус дня, избранное, каталог.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { fetchDirectory, type DirectoryData } from "@/lib/data-client";
import { TodayStrip } from "@/components/status-pill";
import { IconArrowRight, IconBell, IconCompare, IconStar } from "@/components/icons";

const TYPE_LABEL: Record<string, string> = {
  group: "Группа",
  teacher: "Преподаватель",
  room: "Аудитория",
};

export default function HomePage() {
  const { favorites } = useFavorites();
  const [dir, setDir] = useState<DirectoryData | null>(null);
  const [dirError, setDirError] = useState(false);

  useEffect(() => {
    fetchDirectory()
      .then(setDir)
      .catch(() => setDirError(true));
  }, []);

  return (
    <div className="flex flex-col gap-9 pb-4">
      <section className="flex flex-col gap-3 pt-1">
        <div className="overline">ГБУ КО ПОО «Колледж информационных технологий и строительства»</div>
        <h1 className="h-page m-0 max-w-[560px]">Расписание занятий</h1>
        <p className="m-0 max-w-[520px] text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Группы, преподаватели и аудитории. Данные берутся с официального сайта расписания
          колледжа и обновляются автоматически.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link href="/schedule" className="btn btn-primary">
            Открыть расписание
          </Link>
          <Link href="/bells" className="btn">
            <IconBell size={14} /> Звонки
          </Link>
          <Link href="/compare" className="btn">
            <IconCompare size={14} /> Сравнить
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <TodayStrip />
        <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
          {dir?.updatedAt ? `обновлено ${dir.updatedAt}` : ""}
        </span>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="h-section m-0 flex items-center gap-1.5">
            <IconStar size={13} /> Избранное
          </h2>
          <span className="text-[11.5px]" style={{ color: "var(--faint)" }}>
            хранится в этом браузере
          </span>
        </div>

        {favorites.length === 0 ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3.5"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>
              Пусто. Откройте расписание и нажмите на звёздочку ☆ — группа, преподаватель
              или аудитория появятся здесь.
            </span>
            <Link href="/schedule" className="btn btn-sm">
              Выбрать
            </Link>
          </div>
        ) : (
          <ul className="m-0 list-none border-t p-0" style={{ borderColor: "var(--border)" }}>
            {favorites.map((f) => (
              <li
                key={`${f.type}:${f.id}`}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span className="tag w-[104px] shrink-0 justify-center">{TYPE_LABEL[f.type]}</span>
                <Link
                  href={`/schedule?type=${f.type}&id=${f.id}`}
                  className="min-w-0 flex-1 truncate text-[13.5px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {f.label || f.id}
                </Link>
                <Link
                  href={`/schedule?type=${f.type}&id=${f.id}`}
                  className="shrink-0 text-[11.5px] font-semibold"
                  style={{ color: "var(--muted)" }}
                  aria-label={`Открыть расписание: ${f.label}`}
                >
                  открыть →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="h-section m-0 mb-1">Каталог</h2>
        {dirError && (
          <p className="m-0 mt-2 text-[12.5px]" style={{ color: "var(--warn)" }}>
            Не удалось загрузить данные. Обновите страницу.
          </p>
        )}
        <div className="grid grid-cols-1 border-t sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
          {[
            { href: "/schedule?type=group", label: "Группы", count: dir?.groups.length },
            { href: "/teachers", label: "Преподаватели", count: dir?.teachers.length },
            { href: "/schedule?type=room", label: "Аудитории", count: dir?.rooms.length },
          ].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between gap-3 py-4 sm:px-4 sm:first:pl-0 sm:last:pr-0 ${
                i > 0 ? "sm:border-l" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-[13px] font-semibold">{item.label}</span>
              <span className="flex items-baseline gap-2">
                <span className="mono text-[20px] font-bold leading-none">{item.count ?? "—"}</span>
                <IconArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
