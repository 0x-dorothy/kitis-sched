"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeMenu, useTheme } from "@/lib/theme";
import { StatusPill } from "./status-pill";
import {
  IconBell,
  IconCalendar,
  IconCompare,
  IconHome,
  IconStar,
  IconUsers,
} from "./icons";

const NAV = [
  { href: "/", label: "Главная", icon: IconHome },
  { href: "/schedule", label: "Расписание", icon: IconCalendar },
  { href: "/teachers", label: "Преподаватели", icon: IconUsers },
  { href: "/bells", label: "Звонки", icon: IconBell },
  { href: "/compare", label: "Сравнить", icon: IconCompare },
];

export function Header() {
  const pathname = usePathname();
  const { resolved } = useTheme();
  void resolved;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg) 86%, transparent)",
        }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-5 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="КИТиС — на главную">
            <Image
              src="/kitis-logo-96.png"
              alt=""
              width={28}
              height={24}
              className="h-6 w-auto"
              priority
            />
            <span className="flex flex-col leading-none">
              <span className="text-[14.5px] font-extrabold tracking-tight">КИТиС</span>
              <span
                className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--faint)" }}
              >
                расписание
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Основная навигация">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={
                    active
                      ? { color: "var(--text)", background: "var(--surface-2)" }
                      : { color: "var(--muted)" }
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/bells" className="hidden md:inline-flex" aria-label="Текущая пара">
              <StatusPill />
            </Link>
            <Link href="/bells" className="inline-flex md:hidden" aria-label="Текущая пара">
              <StatusPill showLabel={false} />
            </Link>
            <Link
              href="/profile"
              className="icon-btn"
              aria-label="Избранное и оформление"
              title="Избранное и оформление"
            >
              <IconStar size={16} />
            </Link>
            <ThemeMenu />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg) 92%, transparent)",
          backdropFilter: "blur(10px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Мобильная навигация"
      >
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex flex-col items-center gap-1 pb-2 pt-2.5"
                style={{ color: active ? "var(--accent)" : "var(--faint)" }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} />
                <span className="text-[10px] font-semibold leading-none">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
