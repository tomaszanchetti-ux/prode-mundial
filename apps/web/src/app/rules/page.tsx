import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card, colors, spacing, typography } from "@prode/ui";

export default function RulesPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 56px", display: "grid", gap: spacing[16] }}>
      <Card
        elevated
        style={{
          gap: spacing[12],
          padding: spacing[24],
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.16), transparent 28%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
        }}
      >
        <span style={{ ...typography.small, color: colors.primary500 }}>REGLAS Y PUNTOS</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Lo importante para jugar sin dudas</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 680 }}>
          Estas son las reglas base del MVP para predecir, sumar puntos y competir dentro de tus ligas.
        </p>
      </Card>

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>DEADLINE</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Cada prediccion cierra en el kickoff exacto.</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>No hay tolerancia extra ni cierres manuales despues.</p>
        </Card>

        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>SCORING</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Los puntos se calculan siempre desde backend.</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>El resultado oficial dispara el scoring y actualiza tus estados.</p>
        </Card>

        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>COMPETENCIA</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Toda la competencia visible vive en ligas.</p>
          <p style={{ margin: 0, color: colors.textSecondary }}>No hay ranking global en este MVP.</p>
        </Card>
      </section>

      <Card style={{ gap: spacing[12], padding: spacing[16] }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: colors.textSecondary, fontWeight: 600, textDecoration: "none" }}>
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
