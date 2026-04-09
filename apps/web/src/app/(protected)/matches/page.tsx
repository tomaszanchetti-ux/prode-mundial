import { Button, Card, MatchCard, PredictionModal, ScoreInput, colors, typography } from "@prode/ui";

export default function MatchesPage() {
  const featuredMatch = {
    matchId: "arg-vs-bra",
    stageLabel: "Fecha 1 · Grupo A",
    kickoffLabel: "Cierra hoy a las 21:00",
    status: "editable" as const,
    statusLabel: "Editable",
    predictionSummary: "Argentina 2 - 1 Brasil",
    ctaLabel: "Editar prediccion",
    homeTeam: {
      teamName: "Argentina"
    },
    awayTeam: {
      teamName: "Brasil"
    }
  };

  const fixtureCards = [
    featuredMatch,
    {
      matchId: "esp-vs-uru",
      stageLabel: "Octavos de final",
      kickoffLabel: "Manana a las 18:00",
      status: "editable" as const,
      statusLabel: "Pendiente",
      predictionSummary: undefined,
      ctaLabel: "Predecir",
      homeTeam: {
        teamName: "Espana"
      },
      awayTeam: {
        teamName: "Uruguay"
      }
    },
    {
      matchId: "fra-vs-ger",
      stageLabel: "Fecha 1 · Grupo B",
      kickoffLabel: "Kickoff cerrado",
      status: "locked" as const,
      statusLabel: "Bloqueado",
      predictionSummary: "Francia 1 - 1 Alemania",
      ctaLabel: "Ver resultado",
      homeTeam: {
        teamName: "Francia"
      },
      awayTeam: {
        teamName: "Alemania"
      }
    },
    {
      matchId: "ned-vs-eng",
      stageLabel: "Cuartos de final",
      kickoffLabel: "Resultado procesado",
      status: "scored" as const,
      statusLabel: "Puntuado",
      predictionSummary: "Acertaste ganador. +3 puntos",
      ctaLabel: "Ver puntos",
      homeTeam: {
        teamName: "Paises Bajos"
      },
      awayTeam: {
        teamName: "Inglaterra"
      }
    }
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card elevated>
        <div style={{ display: "grid", gap: 12 }}>
          <span
            style={{
              ...typography.small,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            Epic 2 · CARD 0
          </span>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>Partidos</h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 720 }}>
            Base visual del flujo de fixtures y prediccion. Esta pantalla ya representa estados clave del MVP sobre
            componentes compartidos, sin cerrar todavia contratos ni backend.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button>Proximo pendiente</Button>
          <Button variant="secondary">Filtrar por fase</Button>
          <Button variant="ghost">Ver solo guardados</Button>
        </div>
      </Card>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {fixtureCards.map((match) => (
          <MatchCard
            key={match.matchId}
            awayTeam={match.awayTeam}
            ctaLabel={match.ctaLabel}
            homeTeam={match.homeTeam}
            kickoffLabel={match.kickoffLabel}
            predictionSummary={match.predictionSummary}
            stageLabel={match.stageLabel}
            status={match.status}
            statusLabel={match.statusLabel}
          />
        ))}
      </section>

      <PredictionModal
        awayTeam={featuredMatch.awayTeam}
        helperText="En knockout, si pronosticas empate en 90 minutos, el selector de clasificado pasa a ser obligatorio."
        homeTeam={featuredMatch.homeTeam}
        isOpen
        kickoffLabel={featuredMatch.kickoffLabel}
        saveLabel="Guardar base visual"
        stageLabel={featuredMatch.stageLabel}
        title="Prediction modal listo para integracion"
      >
        <ScoreInput
          awayLabel={featuredMatch.awayTeam.teamName}
          awayValue="1"
          classifierOptions={[
            { label: "Argentina", value: "argentina" },
            { label: "Brasil", value: "brasil" }
          ]}
          classifierValue="argentina"
          homeLabel={featuredMatch.homeTeam.teamName}
          homeValue="1"
        />
      </PredictionModal>
    </div>
  );
}
