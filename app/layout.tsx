import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TelegramInit } from "@/components/telegram-init";
import { BASE_PATH } from "@/lib/base-path";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Расписание · КИТиС",
    template: "%s · КИТиС",
  },
  description:
    "Расписание занятий Колледжа информационных технологий и строительства: группы, преподаватели, аудитории, звонки.",
  applicationName: "КИТиС · расписание",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f10" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-preset="mono" suppressHydrationWarning>
      <body className={`${manrope.variable} min-h-screen antialiased`}>
        <Script src={`${BASE_PATH}/telegram-web-app.js`} strategy="beforeInteractive" />
        <ThemeProvider>
          <TelegramInit />
          <Header />
          <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-5 md:px-6 md:pb-10">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
