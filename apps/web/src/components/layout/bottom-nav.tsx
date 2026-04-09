"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_TABS } from "@prode/shared";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${MAIN_TABS.length}, minmax(0, 1fr))`,
        gap: 8,
        padding: 12,
        borderTop: "1px solid #d8ddcf",
        background: "rgba(250, 248, 240, 0.96)",
        backdropFilter: "blur(12px)"
      }}
    >
      {MAIN_TABS.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              textDecoration: "none",
              textAlign: "center",
              padding: "10px 8px",
              borderRadius: 14,
              color: isActive ? "#102a13" : "#5f6657",
              background: isActive ? "#dce8ca" : "transparent",
              fontWeight: isActive ? 700 : 500
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
