import Link from "next/link";
import { DEFAULT_PUBLIC_BOOTSTRAP, SUPPORT_LINKS } from "@prode/shared";
import { Card, colors, radii, spacing, typography } from "@prode/ui";
import { getPublicBootstrap } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const publicPageStyle = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "24px 16px 56px",
  display: "grid",
  gap: 18
} as const;

export default async function LandingPage() {
  const bootstrap = await getPublicBootstrap().catch((error) => {
    const isDynamicServerUsage =
      error && typeof error === "object" && "digest" in error && error.digest === "DYNAMIC_SERVER_USAGE";

    if (!isDynamicServerUsage) {
      console.error("Falling back to default public bootstrap.", error);
    }

    return DEFAULT_PUBLIC_BOOTSTRAP;
  });

  return (
    <main style={publicPageStyle}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "6px 2px"
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 20, lineHeight: 1, color: colors.textPrimary, letterSpacing: "-0.02em" }}>Prode Mundial</strong>
          <span style={{ ...typography.small, color: colors.textMuted }}>Predice rapido. Compite mejor.</span>
        </div>
        <Link
          href="/login"
          style={{
            minHeight: 44,
            padding: "0 16px",
            borderRadius: radii.pill,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            background: colors.primary500,
            color: colors.textPrimary,
            fontWeight: 700,
            boxShadow: "0 10px 24px rgba(47, 107, 255, 0.24)"
          }}
        >
          Entrar
        </Link>
      </header>

      <section
        style={{
          display: "grid",
          gap: spacing[16],
          padding: spacing[24],
          borderRadius: 28,
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.2), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(7, 17, 31, 0.98) 100%)",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 26px 68px rgba(2, 8, 18, 0.3)"
        }}
      >
        <div style={{ display: "grid", gap: spacing[12] }}>
          <span style={{ ...typography.small, color: colors.primary500 }}>MUNDIAL 2026</span>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(3rem, 9vw, 5.8rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
              color: colors.textPrimary,
              maxWidth: 760
            }}
          >
            {bootstrap.productName}
          </h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: 20, lineHeight: 1.45, color: colors.textSecondary }}>{bootstrap.tagline}</p>
        </div>

        <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div
            style={{
              padding: spacing[16],
              borderRadius: radii.lg,
              background: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ ...typography.small, color: colors.textMuted }}>LOOP</span>
            <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.3, color: colors.textPrimary, fontWeight: 600 }}>
              Entra, predice tu proximo partido y vuelve por puntos.
            </p>
          </div>
          <div
            style={{
              padding: spacing[16],
              borderRadius: radii.lg,
              background: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ ...typography.small, color: colors.textMuted }}>COMPETENCIA</span>
            <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.3, color: colors.textPrimary, fontWeight: 600 }}>
              Todo gira alrededor de tus ligas, no de un ranking global.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link
            href="/login"
            style={{
              minHeight: 52,
              padding: "0 18px",
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              background: colors.primary500,
              color: colors.textPrimary,
              fontWeight: 700,
              boxShadow: "0 10px 24px rgba(47, 107, 255, 0.24)"
            }}
          >
            Jugar ahora
          </Link>
          <Link
            href="/login"
            style={{
              minHeight: 52,
              padding: "0 18px",
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.04)",
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              fontWeight: 700
            }}
          >
            Unirme a una liga
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
          }}
        >
          {bootstrap.features.map((feature) => (
            <div
              key={feature}
              style={{
                padding: spacing[16],
                borderRadius: radii.lg,
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: 15,
                lineHeight: 1.35,
                fontWeight: 600
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card elevated style={{ gap: 10 }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>COMO SE JUEGA</span>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>Predice en segundos</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>Eliges marcador, guardas y sigues. Sin pantallas pesadas ni vueltas raras.</p>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>COMO SUMAS</span>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>Puntos claros post partido</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>El backend resuelve estados, resultados y scoring para que siempre veas lo importante.</p>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>COMO COMPITES</span>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>Tus ligas son el centro</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>Invitas gente, sigues posiciones y vuelves cada dia con una razon concreta para jugar.</p>
        </Card>
      </section>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "4px 2px" }}>
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: colors.textSecondary, fontWeight: 600, textDecoration: "none" }}>
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
