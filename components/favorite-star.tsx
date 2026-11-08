"use client";

// Звёздочка «в избранное» для группы / преподавателя / аудитории.

import { useFavorites } from "@/lib/favorites";
import type { ScheduleType } from "@/lib/types";
import { IconStar } from "./icons";

export function FavoriteStar({
  type,
  id,
  label,
  size = 16,
}: {
  type: ScheduleType;
  id: string;
  label: string;
  size?: number;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(type, id);

  return (
    <button
      className="icon-btn"
      style={{ color: active ? "var(--accent)" : "var(--faint)", width: 30, height: 30 }}
      onClick={() => void toggle(type, id, label)}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      aria-pressed={active}
      title={active ? "Убрать из избранного" : "В избранное"}
    >
      <IconStar size={size} filled={active} />
    </button>
  );
}
