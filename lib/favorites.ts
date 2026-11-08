"use client";

// Избранное: localStorage. Аккаунтов в статической версии нет.

import { useCallback, useEffect, useState } from "react";
import type { ScheduleType } from "./types";

export interface Favorite {
  type: ScheduleType;
  id: string;
  label: string;
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
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readLocal());
    setReady(true);

    const sync = () => setFavorites(readLocal());
    window.addEventListener("storage", sync);
    window.addEventListener("favorites-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("favorites-changed", sync);
    };
  }, []);

  const isFavorite = useCallback(
    (type: ScheduleType, id: string) => favorites.some((f) => f.type === type && f.id === id),
    [favorites]
  );

  const toggle = useCallback(async (type: ScheduleType, id: string, label: string) => {
    const list = readLocal();
    const exists = list.some((f) => f.type === type && f.id === id);
    const next = exists
      ? list.filter((f) => !(f.type === type && f.id === id))
      : [{ type, id, label }, ...list];
    writeLocal(next);
    setFavorites(next);
    window.dispatchEvent(new Event("favorites-changed"));
  }, []);

  return { favorites, isFavorite, toggle, ready };
}
