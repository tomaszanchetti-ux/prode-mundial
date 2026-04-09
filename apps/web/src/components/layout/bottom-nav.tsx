"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";
import { Card, colors, radii } from "@prode/ui";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <Card
      as="nav"
      style={{
        position: "sticky",
        bottom: 12,
        display: "grid",
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        gap: 6,
        padding: 8,
        borderRadius: 999,
        background: "rgba(14, 26, 43, 0.88)",
        backdropFilter: "blur(16px)"
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
              padding: "10px 6px",
              borderRadius: radii.pill,
              color: isActive ? colors.textPrimary : colors.textSecondary,
              background: isActive ? colors.primarySoft : "transparent",
              border: isActive ? "1px solid rgba(47, 107, 255, 0.22)" : "1px solid transparent",
              fontSize: 13,
              lineHeight: 1.2,
              fontWeight: isActive ? 700 : 500
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </Card>
  );
}
