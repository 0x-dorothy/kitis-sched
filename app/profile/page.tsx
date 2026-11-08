"use client";

// Профиль: данные аккаунта, куратор, оформление (темы), избранное.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites";
import { ThemeControls } from "@/lib/theme";
import type { Directory, EntityRef } from "@/lib/types";
import { IconArrowRight } from "@/components/icons";

const TYPE_LABEL: Record<string, string> = {
  group: "Группа",
  teacher: "Преподаватель",
  room: "Аудитория",
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { favorites } = useFavorites();
  const [dir, setDir] = useState<Directory | null>(null);

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDir(d))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-10" aria-label="Загрузка профиля">
        <div className="h-3 w-40 rounded" style={{ background: "var(--surface-2)" }} />
        <div className="h-3 w-56 rounded" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto mt-8 flex max-w-[420px] flex-col items-start gap-3">
        <h1 className="h-page m-0">Профиль</h1>
        <p className="m-0 text-[13px]" style={{ color: "var(--muted)" }}>
          Вы не вошли в аккаунт. Вход нужен только для синхронизации избранного между
          устройствами и доступа к архиву недель.
        </p>
        <div className="mt-1 flex gap-2">
          <Link href="/login" className="btn btn-primary">
            Войти
          </Link>
          <Link href="/register" className="btn">
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  const myGroup: EntityRef | undefined = dir?.groups.find((g) => g.name === user.groupName);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8">
      <section className="flex items-center gap-4 pt-1">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-[18px] font-bold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="m-0 truncate text-[19px] font-extrabold tracking-tight">
            {user.name || user.email}
          </h1>
          <div className="text-[12px]" style={{ color: "var(--muted)" }}>
            {user.email}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2" style={{ borderColor: "var(--border)", background: "var(--border)" }}>
        <div className="p-4" style={{ background: "var(--surface)" }}>
          <div className="overline mb-1">Группа</div>
          {myGroup ? (
            <Link href={`/schedule?type=group&id=${myGroup.id}`} className="text-[13.5px] font-semibold">
              {user.groupName} →
            </Link>
          ) : (
            <span className="text-[13.5px]" style={{ color: "var(--muted)" }}>
              {user.groupName || "не указана"}
            </span>
          )}
        </div>
        <div className="p-4" style={{ background: "var(--surface)" }}>
          <div className="overline mb-1">Куратор</div>
          <span className="text-[13.5px] font-semibold">{user.curator || "не указан"}</span>
        </div>
      </section>

      <section>
        <h2 className="h-section m-0 mb-3">Оформление</h2>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
          <ThemeControls />
        </div>
      </section>

      <section>
        <h2 className="h-section m-0 mb-2">Избранное · {favorites.length}</h2>
        {favorites.length === 0 ? (
          <p className="m-0 text-[12.5px]" style={{ color: "var(--muted)" }}>
            Добавляйте группы, преподавателей и аудитории звёздочкой в расписании.
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
