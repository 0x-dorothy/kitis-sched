import type { NextConfig } from "next";

// STATIC_EXPORT=1 — сборка в статику для GitHub Pages (без сервера).
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isStatic
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: basePath || undefined,
      }
    : {}),
};

export default nextConfig;
