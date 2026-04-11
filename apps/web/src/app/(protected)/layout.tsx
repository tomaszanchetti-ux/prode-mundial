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
        paddingTop: 4
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 20, lineHeight: 1, color: colors.textPrimary, letterSpacing: "-0.02em" }}>Prode Mundial</strong>
        <span style={{ ...typography.small, color: colors.textMuted }}>
          {copyForLocale(locale, "Tu proximo partido empieza aca", "Your next match starts here")}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LanguageToggle />
        <Link
          href="/profile"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            textDecoration: "none",
            color: colors.textPrimary,
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${colors.border}`
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
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 16px 40px", display: "grid", gap: 18 }}>
        <ProtectedHeader />

        <section>{children}</section>
        <BottomNav />
      </main>
    </AuthGuard>
  );
}
