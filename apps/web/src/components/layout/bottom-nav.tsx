"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

function isTabActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const labels = {
    home: copyForLocale(locale, "Inicio", "Home"),
    tournament: copyForLocale(locale, "Tu Mundial", "Your World Cup"),
    worldCup: copyForLocale(locale, "El Mundial", "World Cup"),
    leagues: copyForLocale(locale, "Tus Ligas", "Your Leagues")
  } as const;

  const navLabel = copyForLocale(locale, "Navegación principal", "Main navigation");

  return (
    <nav
      data-bottom-nav
      aria-label={navLabel}
      className="sticky z-50 grid gap-1 p-[6px] rounded-pill border border-border-default shadow-card backdrop-blur-[18px]"
      style={{
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        background: "rgba(255, 255, 255, 0.92)",
        bottom: "max(10px, env(safe-area-inset-bottom))"
      }}
    >
      {MAIN_TABS.map((tab) => {
        const isActive = isTabActive(pathname, tab.href);

        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`no-underline text-center min-h-[44px] grid place-items-center py-[9px] px-1 rounded-pill border border-transparent text-[11px] leading-[1.1] uppercase transition-colors ${
              isActive
                ? "text-primary-600 bg-primary-soft font-bold tracking-[0.06em]"
                : "text-text-muted bg-transparent font-medium tracking-[0.04em] hover:text-text-primary"
            }`}
          >
            {labels[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
