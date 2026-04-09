import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card, colors, spacing, typography } from "@prode/ui";

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 56px", display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12], padding: spacing[24] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>TERMINOS</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Condiciones generales del juego</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 680 }}>
          Esta pantalla deja listo un marco claro para el acceso y uso del producto mientras se completa la version legal definitiva.
        </p>
      </Card>

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>USO</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>La cuenta es personal y se usa para jugar dentro de ligas.</p>
        </Card>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>DATOS</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Las predicciones, puntos y estados se guardan como parte del historial de juego.</p>
        </Card>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>OPERACION</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>El producto puede evolucionar, pero siempre respetando las reglas visibles del MVP.</p>
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
