"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { colors, typography } from "@prode/ui";
import { copyForLocale } from "@/lib/i18n/locale-provider";
import { useLocale } from "@/lib/i18n/locale-provider";

function ProtectedHeader() {
  const { locale } = useLocale();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 2
      }}
    >
      <div style={{ display: "grid", gap: 2 }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>PRODE MUNDIAL</span>
        <strong style={{ fontSize: 18, lineHeight: 1, color: colors.textPrimary, letterSpacing: "-0.02em" }}>
          {copyForLocale(locale, "Juega tu torneo", "Play your tournament")}
        </strong>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LanguageToggle />
        <Link
          href="/profile"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            textDecoration: "none",
            color: colors.textPrimary,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.borderSubtle}`
          }}
        >
          {copyForLocale(locale, "Mi", "Me")}
        </Link>
      </div>
    </header>
  );
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 16px 32px", display: "grid", gap: 16 }}>
        <ProtectedHeader />

        <section>{children}</section>
        <BottomNav />
      </main>
    </AuthGuard>
  );
}
