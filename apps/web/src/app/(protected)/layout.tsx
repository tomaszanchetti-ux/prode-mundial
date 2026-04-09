import type { ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, colors, typography } from "@prode/ui";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 16px 40px", display: "grid", gap: 18 }}>
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
            <span style={{ ...typography.small, color: colors.textMuted }}>Tu proximo partido empieza aca</span>
          </div>
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
            Mi
          </Link>
        </header>

        <section>{children}</section>
        <BottomNav />
      </main>
    </AuthGuard>
  );
}
