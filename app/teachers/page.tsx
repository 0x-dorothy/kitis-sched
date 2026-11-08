"use client";

// Преподаватели: поиск, список с контактами, избранное, переход к расписанию.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EntityRef } from "@/lib/types";
import { FavoriteStar } from "@/components/favorite-star";
import { IconMail, IconPhone, IconSearch } from "@/components/icons";
import contacts from "@/data/teachers-contacts.json";

interface Contact {
  full?: string;
  role?: string;
  curatorOf?: string;
  email?: string;
  phone?: string;
  cabinet?: string;
  note?: string;
}

const typedContacts = contacts as {
  contacts: Record<string, Contact>;
  vacancyNames: string[];
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<EntityRef[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTeachers(d.teachers ?? []))
      .catch(() => setError(true));
  }, []);

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = query.trim().toLowerCase();
    const list = q ? teachers.filter((t) => t.name.toLowerCase().includes(q)) : teachers;
    return [...list].sort((a, b) => {
      const av = typedContacts.vacancyNames.includes(a.name) ? 1 : 0;
      const bv = typedContacts.vacancyNames.includes(b.name) ? 1 : 0;
      return av - bv;
    });
  }, [teachers, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-page m-0">Преподаватели</h1>
          <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
            {teachers ? `${teachers.length} человек · контакты дополняются` : "загрузка списка…"}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--faint)" }}>
            <IconSearch size={14} />
          </span>
          <input
            className="input pl-8"
            placeholder="Поиск по фамилии…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск преподавателя"
          />
        </div>
      </div>

      {error && (
        <p className="m-0 text-[13px]" style={{ color: "var(--warn)" }}>
          Не удалось загрузить список с сайта-источника.
        </p>
      )}

      {!teachers && !error && (
        <div className="flex flex-col gap-2 py-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 rounded" style={{ background: "var(--surface-2)", width: `${64 - i * 4}%` }} />
          ))}
        </div>
      )}

      {teachers && (
        <ul className="m-0 list-none border-t p-0" style={{ borderColor: "var(--border)" }}>
          {filtered.map((t) => {
            const c = typedContacts.contacts[t.name];
            const isVacancy = typedContacts.vacancyNames.includes(t.name);
            return (
              <li
                key={t.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <Link
                    href={`/schedule?type=teacher&id=${t.id}`}
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: isVacancy ? "var(--faint)" : "var(--text)" }}
                  >
                    {c?.full || t.name}
                  </Link>
                  {(c?.role || c?.curatorOf) && (
                    <div className="text-[11px]" style={{ color: "var(--faint)" }}>
                      {[c?.role, c?.curatorOf ? `куратор ${c.curatorOf}` : null].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>

                <div className="hidden min-w-0 items-center gap-3 text-[11.5px] sm:flex" style={{ color: "var(--muted)" }}>
                  {c?.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 truncate">
                      <IconMail size={12} /> {c.email}
                    </a>
                  )}
                  {c?.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1">
                      <IconPhone size={12} /> {c.phone}
                    </a>
                  )}
                  {c?.cabinet && <span>каб. {c.cabinet}</span>}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  {!isVacancy && <FavoriteStar type="teacher" id={t.id} label={t.name} size={14} />}
                  {!isVacancy ? (
                    <Link
                      href={`/schedule?type=teacher&id=${t.id}`}
                      className="btn btn-sm btn-ghost"
                    >
                      расписание →
                    </Link>
                  ) : (
                    <span className="tag">вакансия</span>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-6 text-[13px]" style={{ color: "var(--muted)" }}>
              Ничего не найдено
            </li>
          )}
        </ul>
      )}

      <p className="m-0 text-[11px]" style={{ color: "var(--faint)" }}>
        Контакты берутся из файла data/teachers-contacts.json — их можно дополнять.
      </p>
    </div>
  );
}
