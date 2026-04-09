import Link from "next/link";
import { SUPPORT_LINKS } from "@prode/shared";
import { Card, colors, spacing, typography } from "@prode/ui";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 56px", display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12], padding: spacing[24] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>PRIVACIDAD</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Como se usan tus datos dentro del Prode</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 680 }}>
          Esta base resume el uso de tu informacion de cuenta y de juego mientras se completa la version formal de privacidad.
        </p>
      </Card>

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>CUENTA</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Usamos tu email, nombre visible y datos basicos de autenticacion para operar tu acceso.</p>
        </Card>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>JUEGO</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Tus predicciones, puntos y posiciones se guardan para sostener la experiencia competitiva.</p>
        </Card>
        <Card elevated style={{ gap: 10, padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>CONTROL</span>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>Siempre mantienes acceso a tu perfil y al estado visible de tu cuenta dentro del producto.</p>
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
