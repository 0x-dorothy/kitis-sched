"use client";

// Инициализация внутри Telegram: разворачиваем окно, подхватываем тему,
// включаем системную кнопку «назад».

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTelegram } from "@/lib/telegram";

export function TelegramInit() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const tg = getTelegram();
    if (!tg) return;

    document.documentElement.dataset.tma = "1";
    tg.ready();
    tg.expand();
    try {
      tg.disableVerticalSwipes?.();
    } catch {}

    const saved = localStorage.getItem("th-mode");
    if (!saved || saved === "system") {
      document.documentElement.dataset.scheme = tg.colorScheme === "dark" ? "dark" : "light";
    }

    try {
      tg.setHeaderColor?.("secondary_bg_color");
      tg.setBackgroundColor?.("bg_color");
    } catch {}
  }, []);

  useEffect(() => {
    const tg = getTelegram();
    const back = tg?.BackButton;
    if (!back) return;

    const root = pathname === "/" || pathname === "";
    if (root) {
      back.hide();
      return;
    }

    const onClick = () => router.back();
    back.show();
    back.onClick(onClick);
    return () => {
      back.offClick(onClick);
      back.hide();
    };
  }, [pathname, router]);

  return null;
}
