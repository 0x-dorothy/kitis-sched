// Доступ к БД (бесплатный Postgres от Neon / Vercel Postgres).
// Если DATABASE_URL не задан, приложение работает без БД:
// расписание парсится с источника on-the-fly, избранное хранится в localStorage.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;

export function getSql(): Sql | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_sql) _sql = neon(process.env.DATABASE_URL) as Sql;
  return _sql;
}

export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}

let schemaPromise: Promise<void> | null = null;

/** Ленивое создание схемы (идемпотентно) */
export function ensureSchema(): Promise<void> {
  const sql = getSql();
  if (!sql) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id serial PRIMARY KEY,
          email text UNIQUE NOT NULL,
          password_hash text NOT NULL,
          name text NOT NULL DEFAULT '',
          group_name text NOT NULL DEFAULT '',
          curator text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          kind text NOT NULL,
          item_id text NOT NULL,
          label text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, kind, item_id)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS week_snapshots (
          kind text NOT NULL,
          item_id text NOT NULL,
          week_start date NOT NULL,
          title text NOT NULL DEFAULT '',
          data jsonb NOT NULL,
          source_updated_at text NOT NULL DEFAULT '',
          fetched_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (kind, item_id, week_start)
        )`;
    })().catch((err) => {
      schemaPromise = null; // позволить повторную попытку
      throw err;
    });
  }
  return schemaPromise;
}
