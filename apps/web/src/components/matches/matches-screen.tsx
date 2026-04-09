"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListMatchesQuery, MatchStage, MatchSummary } from "@prode/shared";
import { Button, Card, MatchCard, colors, radii, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatches } from "@/lib/api/client";

type FilterChip = {
  key: string;
  label: string;
  query: ListMatchesQuery;
};

type MatchesScreenViewProps = {
  activeFilterKey: string;
  errorMessage: string | null;
  isLoading: boolean;
  items: MatchSummary[];
  onFilterSelect: (key: string) => void;
  onOpenMatch: (matchId: string) => void;
  onRetry: () => void;
};

const filterChips: FilterChip[] = [
  { key: "all", label: "Todos", query: {} },
  { key: "today", label: "Hoy", query: { filter: "today" } },
  { key: "upcoming", label: "Proximos", query: { filter: "upcoming" } },
  { key: "group", label: "Grupos", query: { stage: "group" } },
  { key: "R32", label: "Octavos", query: { stage: "R32" } },
  { key: "QF", label: "Cuartos", query: { stage: "QF" } },
  { key: "SF", label: "Semis", query: { stage: "SF" } },
  { key: "FINAL", label: "Final", query: { stage: "FINAL" } }
];

function toLocalKickoffLabel(iso: string) {
  const date = new Date(iso);

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toStageLabel(stage: MatchStage, groupId: string | null) {
  if (stage === "group" && groupId) {
    return `Grupo ${groupId}`;
  }

  const labels: Record<Exclude<MatchStage, "group">, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[stage as Exclude<MatchStage, "group">] ?? stage;
}

function toCardTone(match: MatchSummary) {
  if (match.isScored || match.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (match.status === "live") {
    return "live" as const;
  }

  if (!match.isEditable) {
    return "locked" as const;
  }

  return "editable" as const;
}

function toStatusLabel(match: MatchSummary) {
  if (match.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (match.status === "live") {
    return "En vivo";
  }

  if (!match.isEditable) {
    return "Bloqueado";
  }

  if (match.predictionStatus === "saved_editable") {
    return "Guardado";
  }

  return "Pendiente";
}

function summarizeActiveFilter(query: ListMatchesQuery) {
  if (query.filter === "today") {
    return "Partidos que juegan hoy.";
  }

  if (query.filter === "upcoming") {
    return "Partidos abiertos que vienen en el calendario.";
  }

  if (query.stage === "group") {
    return "Vista enfocada en fase de grupos.";
  }

  if (query.stage === "R32") {
    return "Cruces de octavos listos para escanear.";
  }

  if (query.stage === "QF") {
    return "Partidos de cuartos de final.";
  }

  if (query.stage === "SF") {
    return "Semifinales del torneo.";
  }

  if (query.stage === "FINAL") {
    return "La definición del Mundial.";
  }

  return "Todos los partidos disponibles para tu usuario.";
}

export function MatchesScreenView({
  activeFilterKey,
  errorMessage,
  isLoading,
  items,
  onFilterSelect,
  onOpenMatch,
  onRetry
}: MatchesScreenViewProps) {
  const activeFilter = filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0];

  return (
    <div style={{ display: "grid", gap: spacing[20] }}>
      <Card
        elevated
        style={{
          gap: spacing[16],
          background:
            "linear-gradient(135deg, rgba(20, 38, 58, 0.96) 0%, rgba(11, 24, 37, 0.98) 56%, rgba(159, 44, 40, 0.3) 100%)"
        }}
      >
        <div style={{ display: "grid", gap: spacing[8] }}>
          <span
            style={{
              ...typography.small,
              color: colors.warning500,
              textTransform: "uppercase",
              letterSpacing: "0.12em"
            }}
          >
            Matchday Center
          </span>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>Partidos</h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 720 }}>
            {summarizeActiveFilter(activeFilter.query)}
          </p>
        </div>

        <div style={{ display: "flex", gap: spacing[8], overflowX: "auto", paddingBottom: 4 }}>
          {filterChips.map((chip) => {
            const isActive = chip.key === activeFilter.key;

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onFilterSelect(chip.key)}
                style={{
                  minHeight: 38,
                  borderRadius: radii.pill,
                  border: `1px solid ${isActive ? "rgba(200, 168, 93, 0.36)" : colors.border}`,
                  background: isActive ? "rgba(200, 168, 93, 0.14)" : "rgba(7, 19, 31, 0.72)",
                  color: isActive ? "#F3D998" : colors.textSecondary,
                  padding: "0 14px",
                  fontSize: typography.small.fontSize,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer"
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[8], borderColor: "rgba(209, 73, 91, 0.4)" }}>
          <strong style={{ ...typography.body, color: colors.textPrimary }}>No pudimos cargar los partidos</strong>
          <p style={{ ...typography.body, margin: 0, color: "#F2B1BA" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <section style={{ display: "grid", gap: spacing[16] }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} elevated style={{ minHeight: 188, opacity: 0.72 }}>
              <div style={{ display: "grid", gap: spacing[12] }}>
                <div style={{ width: 96, height: 10, borderRadius: radii.pill, background: "rgba(143, 164, 183, 0.18)" }} />
                <div style={{ width: "58%", height: 14, borderRadius: radii.pill, background: "rgba(143, 164, 183, 0.16)" }} />
                <div style={{ width: "100%", height: 80, borderRadius: radii.md, background: "rgba(7, 19, 31, 0.7)" }} />
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: spacing[8], textAlign: "center", justifyItems: "center", padding: spacing[24] }}>
          <span
            style={{
              ...typography.small,
              color: colors.warning500,
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            Sin resultados
          </span>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>No hay partidos para este filtro</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 420 }}>
            Cambiá de vista para seguir encontrando pendientes o revisar otras fases del torneo.
          </p>
        </Card>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <section style={{ display: "grid", gap: spacing[16] }}>
          {items.map((match) => (
            <MatchCard
              key={match.matchId}
              awayTeam={{
                teamName: match.awayTeam.name,
                flagUrl: match.awayTeam.flagUrl
              }}
              ctaLabel={match.ctaLabel}
              homeTeam={{
                teamName: match.homeTeam.name,
                flagUrl: match.homeTeam.flagUrl
              }}
              kickoffLabel={toLocalKickoffLabel(match.kickoffAt)}
              onAction={() => onOpenMatch(match.matchId)}
              predictionSummary={match.userPredictionSummary ?? undefined}
              stageLabel={toStageLabel(match.stage, match.groupId)}
              status={toCardTone(match)}
              statusLabel={toStatusLabel(match)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function MatchesScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [activeFilterKey, setActiveFilterKey] = useState<string>("all");
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeFilter = useMemo(() => filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0], [activeFilterKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setItems([]);

      try {
        const token = await user.getIdToken();
        const response = await getMatches(token, activeFilter.query);

        if (!cancelled) {
          setItems(response.items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("No pudimos cargar los partidos.");
        }

        setItems([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [activeFilter, reloadKey, status, user]);

  return (
    <MatchesScreenView
      activeFilterKey={activeFilterKey}
      errorMessage={errorMessage}
      isLoading={isLoading}
      items={items}
      onFilterSelect={setActiveFilterKey}
      onOpenMatch={(matchId) => router.push(`/matches/${matchId}`)}
      onRetry={() => setReloadKey((current) => current + 1)}
    />
  );
}
