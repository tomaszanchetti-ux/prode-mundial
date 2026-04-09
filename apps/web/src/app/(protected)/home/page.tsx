import { Card } from "@prode/ui";

export default function HomePage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Inicio</h1>
        <p style={{ marginBottom: 0 }}>
          Home autenticada lista como tablero base: desde acá seguirán las cards de partidos pendientes, puntos y ligas.
        </p>
      </Card>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card>
          <h2 style={{ marginTop: 0 }}>Prioridad</h2>
          <p style={{ marginBottom: 0 }}>Te faltan partidos por predecir. Próximo paso: conectar `/api/v1/home`.</p>
        </Card>
        <Card>
          <h2 style={{ marginTop: 0 }}>Loop diario</h2>
          <p style={{ marginBottom: 0 }}>Espacio reservado para el resumen de puntos y actividad del día.</p>
        </Card>
        <Card>
          <h2 style={{ marginTop: 0 }}>Ligas</h2>
          <p style={{ marginBottom: 0 }}>Desde Epic 4 se completará el estado real de membresías e invitaciones.</p>
        </Card>
      </section>
    </div>
  );
}
