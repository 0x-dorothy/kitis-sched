"use client";

// Темы: светлая / тёмная / системная + пресеты «Монохром», «Классика КИТиС», «Свой цвет».
// Схема задаётся атрибутом data-scheme (light|dark; нет атрибута — системная),
// палитра — data-preset. Значения цветов живут в CSS (light-dark()).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconCheck, IconMonitor, IconMoon, IconPalette, IconSun } from "@/components/icons";

export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "mono" | "classic" | "custom";

interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
  accent: string; // hex для пресета «свой цвет»
}

interface ThemeCtx extends ThemeState {
  setMode: (m: ThemeMode) => void;
  setPreset: (p: ThemePreset) => void;
  setAccent: (hex: string) => void;
  resolved: "light" | "dark";
}

const DEFAULTS: ThemeState = { mode: "system", preset: "mono", accent: "#2f6fed" };
const Ctx = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme вне ThemeProvider");
  return ctx;
}

/* ---------- цветовые утилиты ---------- */

function normalizeHex(input: string): string {
  const v = input.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return ("#" + v.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
  }
  return "#2f6fed";
}

function inkFor(hex: string): string {
  const h = normalizeHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.42 ? "#14140f" : "#fbfaf7";
}

export function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemDark() ? "dark" : "light";
  return mode;
}

function applyTheme({ mode, preset, accent }: ThemeState) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-scheme");
  else root.dataset.scheme = mode;

  root.dataset.preset = preset;

  if (preset === "custom") {
    const hex = normalizeHex(accent);
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-2", hex);
    root.style.setProperty("--accent-3", hex);
    root.style.setProperty("--accent-ink", inkFor(hex));
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-2");
    root.style.removeProperty("--accent-3");
    root.style.removeProperty("--accent-ink");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(DEFAULTS);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved: ThemeState = {
      mode: (localStorage.getItem("th-mode") as ThemeMode | null) ?? DEFAULTS.mode,
      preset: (localStorage.getItem("th-preset") as ThemePreset | null) ?? DEFAULTS.preset,
      accent: localStorage.getItem("th-accent") ?? DEFAULTS.accent,
    };
    setState(saved);
    applyTheme(saved);
    setResolved(resolveMode(saved.mode));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const mode = (localStorage.getItem("th-mode") as ThemeMode | null) ?? DEFAULTS.mode;
      if (mode === "system") setResolved(resolveMode("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const update = useCallback((patch: Partial<ThemeState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      applyTheme(next);
      setResolved(resolveMode(next.mode));
      localStorage.setItem("th-mode", next.mode);
      localStorage.setItem("th-preset", next.preset);
      localStorage.setItem("th-accent", next.accent);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        ...state,
        resolved,
        setMode: (mode) => update({ mode }),
        setPreset: (preset) => update({ preset }),
        setAccent: (accent) => update({ preset: "custom", accent: normalizeHex(accent) }),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/* ---------- Элементы управления ---------- */

const MODES: { value: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "Светлая", icon: IconSun },
  { value: "dark", label: "Тёмная", icon: IconMoon },
  { value: "system", label: "Системная", icon: IconMonitor },
];

const PRESETS: { value: ThemePreset; label: string; hint: string }[] = [
  { value: "mono", label: "Монохром", hint: "Чернила и золото" },
  { value: "classic", label: "Классика КИТиС", hint: "Синий · оранжевый · жёлтый" },
  { value: "custom", label: "Свой цвет", hint: "Выбрать акцент" },
];

const SWATCHES = ["#2f6fed", "#0f7b6c", "#b3202c", "#7c4dff", "#b17b0a", "#111214"];

export function ThemeControls({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, preset, setPreset, accent, setAccent } = useTheme();

  return (
    <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
      <div>
        <div className="overline mb-1.5">Тема</div>
        <div className="seg w-full">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                className={`seg-btn flex flex-1 items-center justify-center gap-1.5 ${mode === m.value ? "is-active" : ""}`}
                onClick={() => setMode(m.value)}
                aria-pressed={mode === m.value}
              >
                <Icon size={13} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="overline mb-1.5">Акцент</div>
        <div className="flex flex-col gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors"
              style={{ background: preset === p.value ? "var(--surface-2)" : "transparent" }}
              onClick={() => setPreset(p.value)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      p.value === "mono"
                        ? "linear-gradient(135deg, #1a1b17 50%, #d7b46a 50%)"
                        : p.value === "classic"
                          ? "linear-gradient(135deg, #1d5ba6 33%, #c96a12 33% 66%, #ffc400 66%)"
                          : "conic-gradient(#2f6fed, #b3202c, #b17b0a, #0f7b6c, #2f6fed)",
                  }}
                />
                <span className="text-[13px] font-semibold">{p.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "var(--faint)" }}>
                  {p.value === "custom" && preset === "custom" ? accent : p.hint}
                </span>
                {preset === p.value && <IconCheck size={13} />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className="h-6 w-6 rounded-full border"
              style={{
                background: c,
                borderColor: accent.toLowerCase() === c ? "var(--text)" : "var(--border)",
                boxShadow:
                  accent.toLowerCase() === c ? "0 0 0 2px var(--surface), 0 0 0 3px var(--text)" : "none",
              }}
              onClick={() => setAccent(c)}
              aria-label={`Акцент ${c}`}
            />
          ))}
          <label
            className="ml-1 inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border px-2 text-[11px] font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-3.5 w-3.5 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Свой цвет акцента"
            />
            {accent}
          </label>
        </div>
      )}
    </div>
  );
}

/** Кнопка в шапке с поповером оформления */
export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Оформление"
        aria-expanded={open}
        title="Оформление"
      >
        <IconPalette />
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-64 rounded-xl border p-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pop)" }}
          role="dialog"
          aria-label="Настройки оформления"
        >
          <ThemeControls compact />
        </div>
      )}
    </div>
  );
}
