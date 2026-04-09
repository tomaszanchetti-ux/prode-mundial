"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListMatchesQuery, MatchStage, MatchSummary } from "@prode/shared";
import { Button, Card, MatchCard, colors, radii, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
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
  onOpenQuickPredict: (matchId: string) => void;
  onRetry: () => void;
};

const filterChips: FilterChip[] = [
  { key: "today", label: "Hoy", query: { filter: "today" } },
  { key: "pending", label: "Pendientes", query: { filter: "upcoming" } },
  { key: "upcoming", label: "Proximos", query: { filter: "upcoming" } },
  { key: "group", label: "Grupos", query: { stage: "group" } },
  { key: "R32", label: "Octavos", query: { stage: "R32" } },
  { key: "QF", label: "Cuartos", query: { stage: "QF" } },
  { key: "SF", label: "Semis", query: { stage: "SF" } },
  { key: "FINAL", label: "Final", query: { stage: "FINAL" } },
  { key: "all", label: "Todos", query: {} }
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

function toCountdownLabel(targetIso: string, now = new Date()) {
  const diffMs = new Date(targetIso).getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Disponible ahora";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `Abre en ${minutes}m`;
  }

  if (minutes === 0) {
    return `Abre en ${hours}h`;
  }

  return `Abre en ${hours}h ${minutes}m`;
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
    return "Cerrado";
  }

  if (match.predictionStatus === "saved_editable") {
    return "Guardado";
  }

  return "Pendiente";
}

function summarizeActiveFilter(query: ListMatchesQuery) {
  if (query.filter === "today") {
    return "Tus partidos de hoy, listos para resolver rapido.";
  }

  if (query.filter === "upcoming") {
    return "Los siguientes cruces abiertos para predecir o editar.";
  }

  if (query.stage === "group") {
    return "Todo lo que sigue vivo en fase de grupos.";
  }

  if (query.stage === "R32") {
    return "Cruces directos listos para escanear.";
  }

  if (query.stage === "QF") {
    return "Cuartos con foco total en cada llave.";
  }

  if (query.stage === "SF") {
    return "Semifinales para ajustar lo importante.";
  }

  if (query.stage === "FINAL") {
    return "La definicion del torneo en una sola vista.";
  }

  return "Todos tus partidos disponibles en una sola pasada.";
}

function toPredictionCopy(match: MatchSummary) {
  if (match.predictionStatus === "scored") {
    return match.userPredictionSummary ? `Tu prediccion: ${match.userPredictionSummary}` : "Partido puntuado";
  }

  if (!match.userPredictionSummary) {
    return "Aun no predijiste este partido";
  }

  return `Tu prediccion: ${match.userPredictionSummary}`;
}

function toResultCopy(match: MatchSummary) {
  if (match.predictionStatus === "scored") {
    return "Abre el detalle para ver resultado y puntos.";
  }

  if (!match.isEditable && match.status === "scheduled" && new Date(match.predictionOpensAt).getTime() > Date.now()) {
    return `Disponible desde ${toLocalKickoffLabel(match.predictionOpensAt)}.`;
  }

  if (!match.isEditable) {
    return "Prediccion cerrada. Solo queda seguir el partido.";
  }

  return `Deadline exacto: ${toLocalKickoffLabel(match.deadlineAt)}`;
}

function pickQuickMatch(matches: MatchSummary[]) {
  return matches.find((match) => match.isEditable && match.predictionStatus === "empty") ?? matches.find((match) => match.isEditable) ?? null;
}

function pickNextOpeningMatch(matches: MatchSummary[], now = new Date()) {
  return (
    matches.find(
      (match) =>
        !match.isEditable &&
        match.status === "scheduled" &&
        new Date(match.predictionOpensAt).getTime() > now.getTime()
    ) ?? null
  );
}

export function MatchesScreenView({
  activeFilterKey,
  errorMessage,
  isLoading,
  items,
  onFilterSelect,
  onOpenMatch,
  onOpenQuickPredict,
  onRetry
}: MatchesScreenViewProps) {
  const activeFilter = filterChips.find((chip) => chip.key === activeFilterKey) ?? filterChips[0];
  const quickMatch = pickQuickMatch(items);
  const nextOpeningMatch = pickNextOpeningMatch(items);

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <div style={{ display: "grid", gap: spacing[12] }}>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>Partidos</h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
            {summarizeActiveFilter(activeFilter.query)}
          </p>
        </div>

        {quickMatch ? (
          <Card
            elevated
            style={{
              gap: spacing[12],
              padding: spacing[16],
              background:
                "radial-gradient(circle at top right, rgba(47, 107, 255, 0.16), transparent 28%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
            }}
          >
            <span style={{ ...typography.small, color: colors.primary500 }}>TU PROXIMO PENDIENTE</span>
            <strong style={{ fontSize: 22, lineHeight: 1.1, color: colors.textPrimary }}>
              {quickMatch.homeTeam.name} vs {quickMatch.awayTeam.name}
            </strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{toLocalKickoffLabel(quickMatch.kickoffAt)}</span>
            <Button onClick={() => onOpenQuickPredict(quickMatch.matchId)}>
              {quickMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
            </Button>
          </Card>
        ) : null}

        {!quickMatch && nextOpeningMatch ? (
          <Card
            elevated
            style={{
              gap: spacing[12],
              padding: spacing[16],
              background:
                "radial-gradient(circle at top right, rgba(231, 198, 106, 0.12), transparent 28%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
            }}
          >
            <span style={{ ...typography.small, color: colors.gold500 }}>PROXIMA VENTANA</span>
            <strong style={{ fontSize: 22, lineHeight: 1.1, color: colors.textPrimary }}>
              {nextOpeningMatch.homeTeam.name} vs {nextOpeningMatch.awayTeam.name}
            </strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
              Abre {toLocalKickoffLabel(nextOpeningMatch.predictionOpensAt)} · {toCountdownLabel(nextOpeningMatch.predictionOpensAt)}
            </span>
            <Button variant="secondary" onClick={() => onOpenMatch(nextOpeningMatch.matchId)}>
              Ver detalle
            </Button>
          </Card>
        ) : null}

        <div style={{ display: "flex", gap: spacing[8], overflowX: "auto", paddingBottom: 2 }}>
          {filterChips.map((chip) => {
            const isActive = chip.key === activeFilter.key;

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onFilterSelect(chip.key)}
                style={{
                  minHeight: 34,
                  borderRadius: radii.pill,
                  border: isActive ? "1px solid rgba(47, 107, 255, 0.26)" : `1px solid ${colors.border}`,
                  background: isActive ? colors.primarySoft : "rgba(255, 255, 255, 0.02)",
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  padding: "0 12px",
                  fontSize: 13,
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
      </div>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[8], borderColor: "rgba(220, 38, 38, 0.24)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar los partidos</strong>
          <p style={{ ...typography.body, margin: 0, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <section style={{ display: "grid", gap: 14 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} elevated style={{ minHeight: 176, opacity: 0.72 }}>
              <div style={{ display: "grid", gap: spacing[12] }}>
                <div style={{ width: 88, height: 10, borderRadius: radii.pill, background: "rgba(148, 163, 184, 0.16)" }} />
                <div style={{ width: "54%", height: 12, borderRadius: radii.pill, background: "rgba(148, 163, 184, 0.16)" }} />
                <div style={{ width: "100%", height: 84, borderRadius: radii.md, background: "rgba(255, 255, 255, 0.03)" }} />
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: spacing[8], textAlign: "center", justifyItems: "center", padding: spacing[24] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>SIN PARTIDOS</span>
          <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>No encontramos cruces para este filtro</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 420 }}>
            Cambia de vista para seguir avanzando o revisar otra fase del torneo.
          </p>
        </Card>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <section style={{ display: "grid", gap: 14 }}>
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
              predictionSummary={toPredictionCopy(match)}
              resultSummary={toResultCopy(match)}
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
  const [activeFilterKey, setActiveFilterKey] = useState<string>("pending");
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [dismissedCycle, setDismissedCycle] = useState(false);

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

  const quickMatch = useMemo(() => pickQuickMatch(items), [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !quickMatch) {
      return;
    }

    setActiveMatchId(quickMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, quickMatch]);

  return (
    <>
      <MatchesScreenView
        activeFilterKey={activeFilterKey}
        errorMessage={errorMessage}
        isLoading={isLoading}
        items={items}
        onFilterSelect={(nextKey) => {
          setDismissedCycle(false);
          setActiveFilterKey(nextKey);
        }}
        onOpenMatch={(matchId) => router.push(`/matches/${matchId}`)}
        onOpenQuickPredict={(matchId) => {
          setDismissedCycle(false);
          setActiveMatchId(matchId);
        }}
        onRetry={() => setReloadKey((current) => current + 1)}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        onClose={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
        }}
        onSaved={() => {
          setActiveMatchId(null);
          setDismissedCycle(false);
          setReloadKey((current) => current + 1);
        }}
      />
    </>
  );
}
