"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary } from "@prode/shared";
import { Button, Card, StatusTag, TeamDisplay, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { MarathonPredictionModal } from "@/components/matches/marathon-prediction-modal";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches, getPreTournamentSummary } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";

function toStageLabel(match: MatchSummary) {
  if (match.stage === "group" && match.groupId) {
    return `Grupo ${match.groupId}`;
  }

  const labels: Record<string, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[match.stage] ?? match.stage;
}

function toKickoffLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
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

function toCompletionCopy(summary: PreTournamentSummary) {
  if (summary.totalMatches === 0) {
    return "Todavia no cargamos partidos de grupos para completar.";
  }

  if (summary.completedMatches === 0) {
    return `Empieza tu Mundial completando los ${summary.totalMatches} partidos de grupos.`;
  }

  if (summary.remainingMatches === 0) {
    return "Ya completaste toda la fase de grupos. Ahora puedes revisar como queda tu Mundial.";
  }

  return `Ya llevas ${summary.completionPercentage}% y te faltan ${summary.remainingMatches} partidos para cerrar grupos.`;
}

function pickPriorityMatch(matches: MatchSummary[]) {
  return matches.find((match) => canEditPrediction(match) && match.predictionStatus === "empty") ?? matches.find((match) => canEditPrediction(match)) ?? null;
}

function pickNextOpeningMatch(matches: MatchSummary[], now = new Date()) {
  return (
    matches.find(
      (match) =>
        !canEditPrediction(match) &&
        match.status === "scheduled" &&
        new Date(match.predictionOpensAt).getTime() > now.getTime()
    ) ?? null
  );
}

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

export type HomeScreenViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  preTournamentSummary: PreTournamentSummary | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenRankings: () => void;
  onOpenTournament: () => void;
};

export function HomeScreenView({
  profileDisplayName,
  items,
  preTournamentSummary,
  isLoading,
  errorMessage,
  onRetry,
  onOpenMatch,
  onOpenMatches,
  onOpenLeagues,
  onOpenRankings,
  onOpenTournament
}: HomeScreenViewProps) {
  const pendingMatches = useMemo(() => items.filter((match) => canEditPrediction(match)), [items]);
  const savedEditableMatches = useMemo(
    () => items.filter((match) => canEditPrediction(match) && match.predictionStatus === "saved_editable"),
    [items]
  );
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const nextOpeningMatch = useMemo(() => pickNextOpeningMatch(items), [items]);
  const nextPreTournamentMatch = useMemo(
    () => items.find((match) => match.matchId === preTournamentSummary?.nextPendingMatchId) ?? null,
    [items, preTournamentSummary?.nextPendingMatchId]
  );

  if (preTournamentSummary?.isPreTournament) {
    return (
      <div style={{ display: "grid", gap: spacing[16] }}>
        <Card
          elevated
          style={{
            gap: spacing[12],
            padding: spacing[20],
            background:
              "radial-gradient(circle at top right, rgba(255, 196, 76, 0.16), transparent 28%), radial-gradient(circle at left center, rgba(47, 107, 255, 0.18), transparent 32%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
          }}
        >
          <span style={{ ...typography.small, color: colors.textMuted }}>PRE-TORNEO</span>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
              {preTournamentSummary.completedMatches} / {preTournamentSummary.totalMatches} partidos
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
              {toCompletionCopy(preTournamentSummary)}
            </p>
          </div>

          <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <div
              style={{
                display: "grid",
                gap: 4,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>PROGRESO GLOBAL</span>
              <strong style={{ fontSize: 26, lineHeight: 1, color: colors.textPrimary }}>
                {preTournamentSummary.completionPercentage}%
              </strong>
              <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                {preTournamentSummary.remainingMatches} pendientes
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gap: 4,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>SIGUIENTE PASO</span>
              <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>
                {nextPreTournamentMatch ? `${nextPreTournamentMatch.homeTeam.name} vs ${nextPreTournamentMatch.awayTeam.name}` : "Seguir completando"}
              </strong>
              <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                {nextPreTournamentMatch ? `${toStageLabel(nextPreTournamentMatch)} · ${toKickoffLabel(nextPreTournamentMatch.kickoffAt)}` : "Te llevamos al siguiente pendiente cronologico"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => (nextPreTournamentMatch ? onOpenMatch(nextPreTournamentMatch.matchId) : onOpenMatches())}>
              Seguir completando
            </Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              Ir a Tu Mundial
            </Button>
          </div>
        </Card>

        {nextPreTournamentMatch ? (
          <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ ...typography.small, color: colors.primary500 }}>SIGUIENTE PENDIENTE</span>
                <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                  {toStageLabel(nextPreTournamentMatch)} · {toKickoffLabel(nextPreTournamentMatch.kickoffAt)}
                </span>
              </div>
              <StatusTag
                status={canEditPrediction(nextPreTournamentMatch) ? "editable" : "locked"}
                label={canEditPrediction(nextPreTournamentMatch) ? "Listo para cargar" : toCountdownLabel(nextPreTournamentMatch.predictionOpensAt)}
              />
            </div>

            <div style={{ display: "grid", gap: spacing[12] }}>
              <TeamDisplay teamName={nextPreTournamentMatch.homeTeam.name} flagUrl={nextPreTournamentMatch.homeTeam.flagUrl} size="lg" weight={700} />
              <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
              <TeamDisplay teamName={nextPreTournamentMatch.awayTeam.name} flagUrl={nextPreTournamentMatch.awayTeam.flagUrl} size="lg" weight={700} />
            </div>

            <div
              style={{
                display: "grid",
                gap: 6,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
                {nextPreTournamentMatch.userPredictionSummary
                  ? `Ya guardaste ${nextPreTournamentMatch.userPredictionSummary}`
                  : canEditPrediction(nextPreTournamentMatch)
                    ? "Puedes cargar este partido ahora mismo"
                    : "Este es tu siguiente partido cronologico para completar"}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                {canEditPrediction(nextPreTournamentMatch)
                  ? `Deadline exacto: ${toKickoffLabel(nextPreTournamentMatch.deadlineAt)}`
                  : `La ventana abre ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt)}`}
              </span>
            </div>

            <Button fullWidth onClick={() => onOpenMatch(nextPreTournamentMatch.matchId)}>
              {nextPreTournamentMatch.userPredictionSummary ? "Editar prediccion" : "Seguir completando"}
            </Button>
          </Card>
        ) : null}

        <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>GRUPOS COMPLETADOS</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.completedMatches}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos ya cargados</span>
          </Card>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>POR COMPLETAR</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.remainingMatches}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos todavia pendientes</span>
          </Card>
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{preTournamentSummary.completionPercentage}%</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>avance de tu simulacion</span>
          </Card>
        </div>

        <Card elevated style={{ gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
              <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
                {profileDisplayName ? `${profileDisplayName}, mira como se acomodan tus grupos` : "Visualiza como queda tu Mundial"}
              </h2>
            </div>
            <Button variant="ghost" onClick={onOpenTournament}>
              Abrir
            </Button>
          </div>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Entra a Tu Mundial para revisar tus grupos proyectados y seguir construyendo tu torneo antes del primer partido.
          </p>
        </Card>

        {errorMessage ? (
          <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
            <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
            <Button variant="secondary" onClick={onRetry}>
              Reintentar
            </Button>
          </Card>
        ) : null}

        {isLoading ? (
          <Card style={{ gap: spacing[8], padding: spacing[16] }}>
            <strong style={{ fontSize: 16, color: colors.textPrimary }}>Cargando tu fase pre-torneo</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
              Estamos preparando tu progreso global y el siguiente partido para completar.
            </p>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card
        elevated
        style={{
          gap: spacing[12],
          padding: spacing[20],
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.18), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
        }}
      >
        <span style={{ ...typography.small, color: colors.textMuted }}>HOY EN PRODE MUNDIAL</span>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
            {pendingMatches.length > 0 ? `Te faltan ${pendingMatches.length} partidos` : nextOpeningMatch ? "Tu proxima ventana abre pronto" : "Ya vas al dia"}
          </h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 560 }}>
            {priorityMatch
              ? `Tu proximo partido es ${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}.`
              : nextOpeningMatch
                ? `La siguiente prediccion se habilita para ${nextOpeningMatch.homeTeam.name} vs ${nextOpeningMatch.awayTeam.name}.`
                : "No tienes pendientes inmediatos. Aprovecha para revisar resultados y tus ligas."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => (priorityMatch ? onOpenMatch(priorityMatch.matchId) : onOpenMatches())}>
            {priorityMatch ? "Predecir ahora" : "Ver partidos"}
          </Button>
          <Button variant="ghost" onClick={onOpenLeagues}>
            Ver mis ligas
          </Button>
        </div>
      </Card>

      {priorityMatch ? (
        <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ ...typography.small, color: colors.primary500 }}>PROXIMO PARTIDO</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                {toStageLabel(priorityMatch)} · {toKickoffLabel(priorityMatch.kickoffAt)}
              </span>
            </div>
            <StatusTag status={canEditPrediction(priorityMatch) ? "editable" : "locked"} label={canEditPrediction(priorityMatch) ? "Pendiente" : "Cerrado"} />
          </div>

          <div style={{ display: "grid", gap: spacing[12] }}>
            <TeamDisplay teamName={priorityMatch.homeTeam.name} flagUrl={priorityMatch.homeTeam.flagUrl} size="lg" weight={700} />
            <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
            <TeamDisplay teamName={priorityMatch.awayTeam.name} flagUrl={priorityMatch.awayTeam.flagUrl} size="lg" weight={700} />
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              padding: 14,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
              {priorityMatch.userPredictionSummary ? `Ya guardaste ${priorityMatch.userPredictionSummary}` : "Aun no predijiste este partido"}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              Deadline exacto: {toKickoffLabel(priorityMatch.deadlineAt)}
            </span>
          </div>

          <Button fullWidth onClick={() => onOpenMatch(priorityMatch.matchId)}>
            {priorityMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
          </Button>
        </Card>
      ) : null}

      {!priorityMatch && nextOpeningMatch ? (
        <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ ...typography.small, color: colors.gold500 }}>PROXIMA PREDICCION</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                {toStageLabel(nextOpeningMatch)} · {toKickoffLabel(nextOpeningMatch.kickoffAt)}
              </span>
            </div>
            <StatusTag status="locked" label={toCountdownLabel(nextOpeningMatch.predictionOpensAt)} />
          </div>

          <div style={{ display: "grid", gap: spacing[12] }}>
            <TeamDisplay teamName={nextOpeningMatch.homeTeam.name} flagUrl={nextOpeningMatch.homeTeam.flagUrl} size="lg" weight={700} />
            <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
            <TeamDisplay teamName={nextOpeningMatch.awayTeam.name} flagUrl={nextOpeningMatch.awayTeam.flagUrl} size="lg" weight={700} />
          </div>

          <div
            style={{
              display: "grid",
              gap: 6,
              padding: 14,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
              La ventana abre {toKickoffLabel(nextOpeningMatch.predictionOpensAt)}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              Luego podras crear o editar tu marcador libremente hasta el kickoff.
            </span>
          </div>

          <Button variant="secondary" fullWidth onClick={onOpenMatches}>
            Ver calendario
          </Button>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>RESUMEN DEL DIA</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{scoredMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>partidos ya puntuados</span>
        </Card>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>PENDIENTES</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{pendingMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>todavia editables</span>
        </Card>
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>YA GUARDADOS</span>
          <strong style={{ fontSize: 28, lineHeight: 1, color: colors.textPrimary }}>{savedEditableMatches.length}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>listos para revisar</span>
        </Card>
      </div>

      <Card elevated style={{ gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU POSICION</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{profileDisplayName ?? "Tu perfil"}</h2>
          </div>
          <Button variant="ghost" onClick={onOpenRankings}>
            Ver posiciones
          </Button>
        </div>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Tus ligas y posiciones van a aparecer aca con prioridad competitiva. Por ahora, este bloque ya queda listo para el nuevo loop visual.
        </p>
      </Card>

      <Card elevated style={{ gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>
              Sigue disponible mientras el torneo ya esta en marcha
            </h2>
          </div>
          <Button variant="ghost" onClick={onOpenTournament}>
            Abrir
          </Button>
        </div>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Revisa como quedaron tus grupos proyectados aunque la prioridad principal ya vuelva a ser tu proximo partido editable.
        </p>
      </Card>

      {errorMessage ? (
        <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar tu home</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [marathonStartMatchId, setMarathonStartMatchId] = useState<string | null>(null);
  const [dismissedCycle, setDismissedCycle] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setPreTournamentSummary(null);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [matchesResponse, summaryResponse] = await Promise.all([
          getMatches(token, { limit: 64 }),
          getPreTournamentSummary(token)
        ]);

        if (!cancelled) {
          setItems(matchesResponse.items);
          setPreTournamentSummary(summaryResponse);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar tu actividad.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const pendingGroupMatches = useMemo(
    () =>
      items
        .filter((match) => match.stage === "group" && match.status === "scheduled" && !match.isFinished && match.predictionStatus !== "scored")
        .sort(compareMatchesChronologically),
    [items]
  );
  const matchesById = useMemo(() => new Map(items.map((match) => [match.matchId, match])), [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !priorityMatch || preTournamentSummary?.isPreTournament) {
      return;
    }

    setActiveMatchId(priorityMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, preTournamentSummary?.isPreTournament, priorityMatch]);

  return (
    <>
      <HomeScreenView
        profileDisplayName={profile?.displayName ?? null}
        items={items}
        preTournamentSummary={preTournamentSummary}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((current) => current + 1)}
        onOpenMatch={(matchId) => {
          if (preTournamentSummary?.isPreTournament) {
            setMarathonStartMatchId(matchId);
            return;
          }

          setActiveMatchId(matchId);
        }}
        onOpenMatches={() => router.push(APP_ROUTES.matches)}
        onOpenLeagues={() => router.push(APP_ROUTES.leagues)}
        onOpenRankings={() => router.push(APP_ROUTES.rankings)}
        onOpenTournament={() => router.push(APP_ROUTES.tournament)}
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
          setDismissedCycle(true);
          setReloadKey((current) => current + 1);
        }}
      />

      <MarathonPredictionModal
        isOpen={marathonStartMatchId !== null}
        initialMatchId={marathonStartMatchId}
        matchIds={pendingGroupMatches.map((match) => match.matchId)}
        matchesById={matchesById}
        preTournamentSummary={preTournamentSummary}
        onClose={() => setMarathonStartMatchId(null)}
        onSaved={() => setReloadKey((current) => current + 1)}
      />
    </>
  );
}
