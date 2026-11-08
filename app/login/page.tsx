"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, dbConfigured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-col gap-5 pt-6 md:pt-10">
      <div>
        <h1 className="h-page m-0">Вход</h1>
        <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
          Просмотр расписания доступен и без аккаунта.
        </p>
      </div>

      {dbConfigured === false && (
        <div
          className="rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          Аккаунты включатся после подключения базы данных (DATABASE_URL). Пока можно
          пользоваться избранным в браузере.
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="m-0 text-[12px] font-medium" style={{ color: "var(--warn)" }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary mt-1" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>

      <p className="m-0 text-[12px]" style={{ color: "var(--muted)" }}>
        Нет аккаунта?{" "}
        <Link href="/register" className="link">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
