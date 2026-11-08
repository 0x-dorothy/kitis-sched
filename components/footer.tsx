import { SOURCE_URL } from "@/lib/source";
import { IconExternal } from "./icons";

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 pb-24 pt-6 text-[11.5px] sm:flex-row sm:items-center sm:justify-between md:px-6 md:pb-6">
        <span style={{ color: "var(--faint)" }}>
          ГБУ КО ПОО «Колледж информационных технологий и строительства»
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ color: "var(--faint)" }}>
          <span>Данные: официальный сайт расписания</span>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium"
            style={{ color: "var(--muted)" }}
          >
            {SOURCE_URL.replace(/^https?:\/\//, "")}
            <IconExternal size={11} />
          </a>
        </span>
      </div>
    </footer>
  );
}
