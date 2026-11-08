import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
    "Расписание занятий Колледжа информационных технологий и строительства: группы, преподаватели, аудитории, звонки. Источник — официальный сайт расписания.",
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
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 pt-5 md:px-6 md:pb-10">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
