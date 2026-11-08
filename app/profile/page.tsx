"use client";

// Настройки: оформление и избранное (хранится в этом браузере).

import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import { ThemeControls } from "@/lib/theme";
import { IconArrowRight, IconStar } from "@/components/icons";

const TYPE_LABEL: Record<string, string> = {
  group: "Группа",
  teacher: "Преподаватель",
  room: "Аудитория",
};

export default function ProfilePage() {
  const { favorites } = useFavorites();

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8">
      <div className="pt-1">
        <h1 className="h-page m-0">Настройки</h1>
        <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
          Оформление и избранное. Аккаунты в этой версии не нужны — всё хранится в браузере.
        </p>
      </div>

      <section>
        <h2 className="h-section m-0 mb-3">Оформление</h2>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
          <ThemeControls />
        </div>
      </section>

      <section>
        <h2 className="h-section m-0 mb-2 flex items-center gap-1.5">
          <IconStar size={13} /> Избранное · {favorites.length}
        </h2>
        {favorites.length === 0 ? (
          <p className="m-0 text-[12.5px]" style={{ color: "var(--muted)" }}>
            Добавляйте группы, преподавателей и аудитории звёздочкой на странице расписания.
          </p>
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
                  className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {f.label || f.id}
                </Link>
                <IconArrowRight size={13} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
