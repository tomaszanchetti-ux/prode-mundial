import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 40px", display: "grid", gap: 20 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 18px",
            borderRadius: 24,
            background: "rgba(255, 255, 255, 0.72)",
            border: "1px solid #d8ddcf"
          }}
        >
          <div>
            <strong>Prode Mundial</strong>
            <p style={{ margin: "4px 0 0", color: "#5f6657" }}>Shell autenticado base para Epic 1.</p>
          </div>
          <span style={{ fontSize: 14, color: "#5f6657" }}>Sesión protegida</span>
        </header>

        <section>{children}</section>
        <BottomNav />
      </main>
    </AuthGuard>
  );
}
