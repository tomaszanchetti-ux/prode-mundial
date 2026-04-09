import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, colors, typography } from "@prode/ui";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px 40px", display: "grid", gap: 20 }}>
        <Card elevated style={{ gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <strong style={{ ...typography.h3, color: colors.textPrimary }}>Prode Mundial</strong>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Shell autenticado dark-first para el loop diario del MVP.
            </p>
          </div>
          <span style={{ ...typography.small, color: colors.textSecondary }}>Sesion protegida</span>
        </Card>

        <section>{children}</section>
        <BottomNav />
      </main>
    </AuthGuard>
  );
}
