"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeMenu } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { StatusPill } from "./status-pill";
import {
  IconBell,
  IconCalendar,
  IconCompare,
  IconHome,
  IconLogout,
  IconUser,
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
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

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
              <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
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
            <ThemeMenu />
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex h-8 items-center gap-2 rounded-md border px-1.5"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Профиль"
                  aria-expanded={menuOpen}
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                  >
                    {(user.name || user.email).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-28 truncate text-[12.5px] font-semibold sm:inline">
                    {user.name || user.email}
                  </span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-10 w-52 rounded-xl border p-1"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pop)" }}
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      <IconUser size={15} /> Профиль и избранное
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold"
                      style={{ color: "var(--warn)" }}
                      onClick={() => void logout()}
                    >
                      <IconLogout size={15} /> Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-sm">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Мобильная нижняя навигация */}
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
