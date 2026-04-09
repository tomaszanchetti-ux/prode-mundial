import { Button, Card, colors, spacing, typography } from "@prode/ui";

export default function LeaguesPage() {
  return (
    <Card elevated style={{ gap: spacing[12] }}>
      <span style={{ ...typography.small, color: colors.textMuted }}>LIGAS</span>
      <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tu espacio para competir con amigos</h1>
      <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
        Aqui vas a poder entrar, crear y seguir tus ligas con una vista mucho mas competitiva.
      </p>
      <Button>Crear liga</Button>
    </Card>
  );
}
