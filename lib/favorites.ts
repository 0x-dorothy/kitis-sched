"use client";

// Избранное: у авторизованных — в БД (через /api/favorites),
// у гостей — в localStorage. Один и тот же интерфейс.

import { useCallback, useEffect, useState } from "react";
import type { ScheduleType } from "./types";
import { useAuth } from "./auth-context";

export interface Favorite {
  type: ScheduleType;
  id: string; // cg95 / cp131 / ca106
  label: string; // «ИСр24-1»
}

const LS_KEY = "favorites";

function readLocal(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Favorite[];
  } catch {
    return [];
  }
}

function writeLocal(list: Favorite[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function useFavorites() {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      fetch("/api/favorites", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { favorites: [] }))
        .then((d) => setFavorites(d.favorites ?? []))
        .catch(() => setFavorites([]))
        .finally(() => setReady(true));
    } else {
      setFavorites(readLocal());
      setReady(true);
    }
  }, [user, loading]);

  const isFavorite = useCallback(
    (type: ScheduleType, id: string) => favorites.some((f) => f.type === type && f.id === id),
    [favorites]
  );

  const toggle = useCallback(
    async (type: ScheduleType, id: string, label: string) => {
      const exists = favorites.some((f) => f.type === type && f.id === id);
      if (exists) {
        setFavorites((prev) => prev.filter((f) => !(f.type === type && f.id === id)));
        if (user) {
          await fetch(`/api/favorites?type=${type}&id=${id}`, { method: "DELETE" }).catch(() => {});
        } else {
          writeLocal(readLocal().filter((f) => !(f.type === type && f.id === id)));
        }
      } else {
        setFavorites((prev) => [{ type, id, label }, ...prev]);
        if (user) {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, id, label }),
          }).catch(() => {});
        } else {
          writeLocal([{ type, id, label }, ...readLocal()]);
        }
      }
    },
    [favorites, user]
  );

  return { favorites, isFavorite, toggle, ready };
}

/** Группа «по умолчанию» для главной (прошлый выбор хранится локально) */
export function useDefaultEntity(): [
  { type: ScheduleType; id: string } | null,
  (v: { type: ScheduleType; id: string }) => void
] {
  const { user } = useAuth();
  const [value, setValue] = useState<{ type: ScheduleType; id: string } | null>(null);

  useEffect(() => {
    if (user?.groupName) {
      // при регистрации указана группа — попробуем найти её id позже на странице
    }
    const saved = localStorage.getItem("defaultEntity");
    if (saved) {
      try {
        setValue(JSON.parse(saved));
      } catch {}
    }
  }, [user]);

  const set = useCallback((v: { type: ScheduleType; id: string }) => {
    setValue(v);
    localStorage.setItem("defaultEntity", JSON.stringify(v));
  }, []);

  return [value, set];
}
