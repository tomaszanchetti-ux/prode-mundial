"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const labels = {
    home: copyForLocale(locale, "Inicio", "Home"),
    matches: copyForLocale(locale, "Partidos", "Matches"),
    rankings: copyForLocale(locale, "Posiciones", "Standings"),
    leagues: copyForLocale(locale, "Ligas", "Leagues"),
    profile: copyForLocale(locale, "Perfil", "Profile")
  } as const;

  return (
    <nav
      aria-label="Main navigation"
      className="sticky bottom-[10px] grid gap-1 p-[6px] rounded-pill border border-[rgba(148,163,184,0.14)] shadow-[0_20px_40px_rgba(2,8,18,0.24)] backdrop-blur-[18px]"
      style={{
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        background: "rgba(8, 18, 32, 0.82)"
      }}
    >
      {MAIN_TABS.map((tab) => {
        const isActive = tab.href === "/matches" ? pathname === tab.href || pathname.startsWith("/matches/") : pathname === tab.href;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`no-underline text-center py-[9px] px-1 rounded-pill border border-transparent text-[11px] leading-[1.1] uppercase ${
              isActive
                ? "text-text-primary bg-primary-soft font-bold tracking-[0.06em]"
                : "text-text-muted bg-transparent font-medium tracking-[0.04em]"
            }`}
          >
            {labels[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
