"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";
import { Card, colors, radii, typography } from "@prode/ui";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <Card
      as="nav"
      style={{
        position: "sticky",
        bottom: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        gap: 8,
        padding: 12,
        backdropFilter: "blur(12px)"
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
              padding: "10px 8px",
              borderRadius: radii.md,
              color: isActive ? colors.textPrimary : colors.textSecondary,
              background: isActive ? "rgba(201, 168, 93, 0.16)" : "transparent",
              border: isActive ? `1px solid rgba(201, 168, 93, 0.3)` : "1px solid transparent",
              ...typography.body,
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
