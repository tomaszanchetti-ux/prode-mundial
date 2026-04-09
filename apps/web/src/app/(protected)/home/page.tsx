import { Card, colors, typography } from "@prode/ui";

export default function HomePage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card elevated>
        <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>Inicio</h1>
        <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
          Home autenticada lista como tablero base. Desde aca seguira el loop de partidos pendientes, puntos y ligas.
        </p>
      </Card>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Prioridad</h2>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Te faltan partidos por predecir. Proximo paso: conectar `/api/v1/home`.
          </p>
        </Card>
        <Card>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Loop diario</h2>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Espacio reservado para el resumen de puntos y actividad del dia.
          </p>
        </Card>
        <Card>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Ligas</h2>
          <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
            Desde Epic 4 se completara el estado real de membresias e invitaciones.
          </p>
        </Card>
      </section>
    </div>
  );
}
