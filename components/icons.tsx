// Тонкие линейные иконки (stroke 1.6) — единый визуальный язык вместо эмодзи.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.9c1.7.6 2.8 2.2 3.1 4.1" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9.5a6 6 0 1 1 12 0c0 3.2.8 5 1.6 6H4.4c.8-1 1.6-2.8 1.6-6Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const IconCompare = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 4v16M15 4v16" />
    <path d="M4 8.5 6.5 6 9 8.5M20 15.5 17.5 18 15 15.5" />
  </svg>
);

export const IconStar = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8Z" />
  </svg>
);

export const IconSun = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
);

export const IconMoon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.4 8.4 0 1 0 20 14.5Z" />
  </svg>
);

export const IconMonitor = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="12" rx="1.6" />
    <path d="M8.5 20h7M12 16.5V20" />
  </svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconDoor = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 20V4.5h12V20" />
    <path d="M4 20h16M14.5 12h.01" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 8V5.5h-9v13h9V16" />
    <path d="M10 12h10.5M17.5 8.5 21 12l-3.5 3.5" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

export const IconPalette = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.8 0-1-.7-1.4-.7-2.3 0-.9.7-1.4 1.7-1.4h1.6c2 0 3.4-1.3 3.4-3.5 0-4.4-3.6-8-8-8Z" />
    <circle cx="7.6" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.4" cy="7.4" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" />
  </svg>
);

export const IconList = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
);

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4.5" width="16" height="15" rx="1.4" />
    <path d="M4 9.5h16M9.5 9.5v10" />
  </svg>
);

export const IconExternal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13.5 5H19v5.5M19 5l-7.5 7.5" />
    <path d="M17 14.5V19H5V7h4.5" />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
    <path d="m4.5 7 7.5 5.5L19.5 7" />
  </svg>
);

export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 4h3l1.2 4-2 1.4a11 11 0 0 0 5.9 5.9l1.4-2 4 1.2v3c0 1-.8 1.8-1.8 1.7C10.5 18.5 5.5 13.5 4.8 5.8 4.7 4.8 5.5 4 6.5 4Z" />
  </svg>
);
