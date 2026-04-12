"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";
import { colors, radii, typography } from "@prode/ui";
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
      style={{
        position: "sticky",
        bottom: 10,
        display: "grid",
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        gap: 4,
        padding: 6,
        borderRadius: 999,
        background: "rgba(8, 18, 32, 0.82)",
        border: "1px solid rgba(148, 163, 184, 0.14)",
        boxShadow: "0 20px 40px rgba(2, 8, 18, 0.24)",
        backdropFilter: "blur(18px)"
      }}
    >
      {MAIN_TABS.map((tab) => {
        const isActive = tab.href === "/matches" ? pathname === tab.href || pathname.startsWith("/matches/") : pathname === tab.href;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              textDecoration: "none",
              textAlign: "center",
              padding: "9px 4px",
              borderRadius: radii.pill,
              color: isActive ? colors.textPrimary : colors.textMuted,
              background: isActive ? "rgba(47, 107, 255, 0.14)" : "transparent",
              border: "1px solid transparent",
              fontSize: typography.small.fontSize,
              lineHeight: 1.1,
              letterSpacing: isActive ? "0.06em" : "0.04em",
              textTransform: "uppercase",
              fontWeight: isActive ? 700 : 500
            }}
          >
            {labels[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
