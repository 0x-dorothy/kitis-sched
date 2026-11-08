// Уведомление в Telegram об обновлении расписания.
// Запускается из GitHub Actions после коммита данных.

import fs from "node:fs";
import { execSync } from "node:child_process";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const SITE_URL = process.env.SITE_URL ?? "https://0x-dorothy.github.io/kitis-sched/";

interface Meta {
  generatedAt: string;
  sourceUpdatedAt: string;
  weekStart: string;
}

function readMeta(fromGit: boolean): Meta | null {
  try {
    if (fromGit) {
      const raw = execSync("git show HEAD~1:public/data/meta.json", { encoding: "utf8" });
      return JSON.parse(raw) as Meta;
    }
    return JSON.parse(fs.readFileSync("public/data/meta.json", "utf8")) as Meta;
  } catch {
    return null;
  }
}

function range(weekStart: string): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d) + 6 * 86400000);
  const sameMonth = end.getUTCMonth() === m - 1;
  return sameMonth
    ? `${d}–${end.getUTCDate()} ${months[m - 1]}`
    : `${d} ${months[m - 1]} — ${end.getUTCDate()} ${months[end.getUTCMonth()]}`;
}

async function send(text: string) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть расписание", url: SITE_URL }]],
      },
    }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(`telegram: ${data.description}`);
}

async function main() {
  if (!TOKEN) {
    console.log("TELEGRAM_BOT_TOKEN не задан — пропускаем");
    return;
  }
  if (!CHAT_ID) {
    console.log("TELEGRAM_CHAT_ID не задан — пропускаем (нажмите /start у бота)");
    return;
  }

  const now = readMeta(false);
  const prev = readMeta(true);
  if (!now) {
    console.log("нет meta.json — пропускаем");
    return;
  }

  const newWeek = prev?.weekStart !== now.weekStart;
  const updated = prev?.sourceUpdatedAt !== now.sourceUpdatedAt;
  if (!newWeek && !updated) {
    console.log("изменений нет — пропускаем");
    return;
  }

  const head = newWeek
    ? `📅 <b>Опубликовано расписание</b> на ${range(now.weekStart)}`
    : `✏️ <b>Расписание обновлено</b> (${range(now.weekStart)})`;

  await send(`${head}\n<span style="color:#888">Источник: сайт колледжа</span>`);
  console.log("уведомление отправлено");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
