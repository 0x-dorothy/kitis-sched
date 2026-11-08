"use client";

// Регистрация: email, пароль, имя, группа из справочника, ФИО куратора.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { Directory } from "@/lib/types";

export default function RegisterPage() {
  const { register, dbConfigured } = useAuth();
  const router = useRouter();
  const [dir, setDir] = useState<Directory | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    password2: "",
    name: "",
    group: "",
    curator: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDir(d))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError("Пароли не совпадают");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        group: form.group,
        curator: form.curator,
      });
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5 pt-6 md:pt-10">
      <div>
        <h1 className="h-page m-0">Регистрация</h1>
        <p className="m-0 mt-1 text-[12.5px]" style={{ color: "var(--muted)" }}>
          Аккаунт нужен только для избранного в облаке и архива недель.
        </p>
      </div>

      {dbConfigured === false && (
        <div
          className="rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          База данных ещё не подключена — форма заработает после добавления DATABASE_URL.
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" className="input" type="email" required value={form.email} onChange={set("email")} placeholder="student@example.com" autoComplete="email" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Пароль *</label>
            <input id="password" className="input" type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="минимум 6 символов" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="password2">Повторите *</label>
            <input id="password2" className="input" type="password" required minLength={6} value={form.password2} onChange={set("password2")} placeholder="ещё раз" autoComplete="new-password" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="name">Имя и фамилия</label>
          <input id="name" className="input" value={form.name} onChange={set("name")} placeholder="Иван Иванов" />
        </div>
        <div>
          <label className="label" htmlFor="group">Группа</label>
          <select id="group" className="input" value={form.group} onChange={set("group")}>
            <option value="">— выбрать —</option>
            {dir?.groups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="curator">ФИО куратора</label>
          <input id="curator" className="input" value={form.curator} onChange={set("curator")} placeholder="напр. Шевченко Полина Сергеевна" />
        </div>
        {error && (
          <p className="m-0 text-[12px] font-medium" style={{ color: "var(--warn)" }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary mt-1" disabled={busy}>
          {busy ? "Создаём аккаунт…" : "Зарегистрироваться"}
        </button>
      </form>

      <p className="m-0 text-[12px]" style={{ color: "var(--muted)" }}>
        Уже есть аккаунт?{" "}
        <Link href="/login" className="link">
          Войти
        </Link>
      </p>
    </div>
  );
}
