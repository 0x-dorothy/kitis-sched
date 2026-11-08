// Опрос бота: ловит /start и любые сообщения, запоминает chat_id
// в переменную репозитория (её использует notify.ts) и отвечает кнопкой.
// Запускается по крону из GitHub Actions — отдельный сервер не нужен.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const GH_TOKEN = process.env.GITHUB_TOKEN ?? "";
const REPO = process.env.GITHUB_REPOSITORY ?? "";
const SITE_URL = process.env.SITE_URL ?? "https://0x-dorothy.github.io/kitis-sched/";

const GH = "https://api.github.com";
const ghHeaders = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "kitis-bot",
  "Content-Type": "application/json",
};

async function getVariable(name) {
  const res = await fetch(`${GH}/repos/${REPO}/actions/variables/${name}`, { headers: ghHeaders });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function setVariable(name, value) {
  const exists = await getVariable(name);
  const body = JSON.stringify({ name, value: String(value) });
  const url = exists === null
    ? `${GH}/repos/${REPO}/actions/variables`
    : `${GH}/repos/${REPO}/actions/variables/${name}`;
  const res = await fetch(url, { method: exists === null ? "POST" : "PATCH", headers: ghHeaders, body });
  if (!res.ok && res.status !== 409) console.log(`variable ${name}: ${res.status} ${await res.text()}`);
}

async function tg(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) console.log(`${method}: ${data.description}`);
  return data;
}

async function main() {
  if (!TOKEN) return console.log("нет токена бота");

  const stored = await getVariable("TG_OFFSET");
  const offset = stored ? Number(stored) + 1 : 0;

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=0`);
  const data = await res.json();
  const updates = data.result ?? [];
  console.log(`новых сообщений: ${updates.length}`);

  let lastId = offset ? offset - 1 : 0;

  for (const u of updates) {
    lastId = Math.max(lastId, u.update_id);
    const msg = u.message ?? u.edited_message;
    if (!msg?.chat?.id) continue;

    const chatId = msg.chat.id;
    await setVariable("TELEGRAM_CHAT_ID", chatId);

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        "Расписание КИТиС под рукой.\n\n" +
        "Кнопка «Расписание» внизу открывает приложение. " +
        "Сюда же будут приходить уведомления, когда колледж опубликует новую неделю.",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть расписание", url: SITE_URL }]],
      },
    });
  }

  if (lastId) await setVariable("TG_OFFSET", lastId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
