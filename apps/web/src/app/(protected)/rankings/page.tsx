import { Button, Card, colors, spacing, typography } from "@prode/ui";

export default function RankingsPage() {
  return (
    <Card elevated style={{ gap: spacing[12] }}>
      <span style={{ ...typography.small, color: colors.textMuted }}>POSICIONES</span>
      <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tus ligas y tu lugar en cada una</h1>
      <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
        Esta vista va a mostrar standings por liga y variaciones de posicion, sin ranking global.
      </p>
      <Button variant="ghost">Ver mis ligas</Button>
    </Card>
  );
}
