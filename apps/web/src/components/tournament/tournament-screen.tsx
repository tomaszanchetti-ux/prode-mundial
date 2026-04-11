"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary, type TuMundialGroupCard, type TuMundialResponse } from "@prode/shared";
import { Button, Card, ProgressCompact, StatusTag, TeamDisplay, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { MarathonPredictionModal } from "@/components/matches/marathon-prediction-modal";
import { ApiClientError, getMatches, getPreTournamentSummary, getTuMundial } from "@/lib/api/client";

type GroupStandingsCardProps = {
  group: TuMundialGroupCard;
};

type TournamentScreenViewProps = {
  errorMessage: string | null;
  groups: TuMundialGroupCard[];
  isLoading: boolean;
  onContinuePredictions: () => void;
  onOpenHome: () => void;
  onOpenMatches: () => void;
  onRetry: () => void;
  preTournamentSummary: PreTournamentSummary | null;
  profileDisplayName: string | null;
};

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

function toGroupState(group: TuMundialGroupCard) {
  if (group.completedMatches === 0) {
    return {
      label: "Pendiente",
      tone: "locked" as const,
      copy: "Todavia no hay suficientes partidos para proyectar la pelea por clasificar."
    };
  }

  if (group.isComplete) {
    return {
      label: "Cerrado",
      tone: "scored" as const,
      copy: "Asi quedaria el grupo si el Mundial terminara segun tus pronosticos."
    };
  }

  return {
    label: "Parcial",
    tone: "editable" as const,
    copy: "La tabla sigue viva: todavia quedan partidos que pueden mover a los clasificados."
  };
}

function GroupStandingsCard({ group }: GroupStandingsCardProps) {
  const state = toGroupState(group);

  return (
    <Card elevated style={{ gap: spacing[12], padding: spacing[16] }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[12] }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>{group.groupName}</span>
          <strong style={{ fontSize: 18, lineHeight: 1.25, color: colors.textPrimary }}>Asi va quedando la tabla</strong>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
            {group.completedMatches} / {group.totalMatches} partidos proyectados
          </span>
        </div>
        <StatusTag status={state.tone} label={state.label} />
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{state.copy}</p>

      <div
        style={{
          display: "grid",
          gap: spacing[8],
          padding: spacing[12],
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${colors.border}`
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 44px 44px 44px",
            gap: spacing[8],
            alignItems: "center"
          }}
        >
          <span style={{ ...typography.small, color: colors.textMuted }}>Equipo</span>
          <span style={{ ...typography.small, color: colors.textMuted, textAlign: "center" }}>PJ</span>
          <span style={{ ...typography.small, color: colors.textMuted, textAlign: "center" }}>DG</span>
          <span style={{ ...typography.small, color: colors.textMuted, textAlign: "center" }}>Pts</span>
        </div>

        {group.items.map((item) => (
          <div
            key={item.teamId}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 44px 44px 44px",
              gap: spacing[8],
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 14,
              background: item.isProjectedQualified ? "rgba(47, 107, 255, 0.12)" : "rgba(255, 255, 255, 0.02)",
              border: item.isProjectedQualified ? "1px solid rgba(47, 107, 255, 0.22)" : `1px solid ${colors.border}`
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, lineHeight: 1.2, color: item.isProjectedQualified ? "#9BE5B6" : colors.textMuted, fontWeight: item.isProjectedQualified ? 700 : 600 }}>
                #{item.position} {item.isProjectedQualified ? "clasifica" : ""}
              </span>
              <TeamDisplay
                teamName={item.teamName}
                fifaCode={item.fifaCode}
                flagAsset={item.flagAsset}
                flagUrl={item.flagUrl}
                size="sm"
                weight={item.isProjectedQualified ? 700 : 600}
              />
            </div>
            <span style={{ fontSize: 14, lineHeight: 1.2, color: colors.textPrimary, textAlign: "center" }}>{item.played}</span>
            <span style={{ fontSize: 14, lineHeight: 1.2, color: colors.textPrimary, textAlign: "center" }}>{item.goalDifference}</span>
            <span style={{ fontSize: 14, lineHeight: 1.2, color: colors.textPrimary, textAlign: "center", fontWeight: 700 }}>{item.points}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TournamentScreenView({
  errorMessage,
  groups,
  isLoading,
  onContinuePredictions,
  onOpenHome,
  onOpenMatches,
  onRetry,
  preTournamentSummary,
  profileDisplayName
}: TournamentScreenViewProps) {
  const completedGroups = groups.filter((group) => group.isComplete).length;
  const partialGroups = groups.filter((group) => group.completedMatches > 0 && !group.isComplete).length;
  const emptyGroups = groups.filter((group) => group.completedMatches === 0).length;
  const isPreTournament = preTournamentSummary?.isPreTournament ?? false;

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
        <span style={{ ...typography.small, color: colors.textMuted }}>TU MUNDIAL</span>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>
            {profileDisplayName ? `${profileDisplayName}, asi se mueve tu Mundial` : "Asi se mueve tu Mundial"}
          </h1>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 620 }}>
            {isPreTournament
              ? "Cada prediccion empuja la tabla de su grupo. Aqui ves rapido quienes estarian clasificando segun tu simulacion."
              : "Tus grupos proyectados siguen disponibles aunque el producto ya este priorizando el loop diario del torneo en vivo."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={isPreTournament ? onContinuePredictions : onOpenHome}>
            {isPreTournament ? "Continuar mis predicciones" : "Volver al home en vivo"}
          </Button>
          <Button variant="ghost" onClick={onOpenMatches}>
            Ver calendario
          </Button>
        </div>
      </Card>

      <ProgressCompact
        items={[
          {
            label: "CERRADOS",
            value: String(completedGroups),
            hint: "grupos ya definidos"
          },
          {
            label: "EN PELEA",
            value: String(partialGroups),
            hint: "grupos todavia vivos"
          },
          {
            label: "PENDIENTES",
            value: String(emptyGroups),
            hint: "todavia sin mover"
          }
        ]}
      />

      {preTournamentSummary ? (
        <Card elevated style={{ gap: spacing[8], padding: spacing[16] }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>TU AVANCE GLOBAL</span>
              <strong style={{ fontSize: 20, lineHeight: 1.2, color: colors.textPrimary }}>
                {preTournamentSummary.completedMatches} / {preTournamentSummary.totalMatches} partidos
              </strong>
            </div>
            <StatusTag status={preTournamentSummary.remainingMatches === 0 ? "scored" : "editable"} label={`${preTournamentSummary.completionPercentage}%`} />
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
            {preTournamentSummary.remainingMatches === 0
              ? "Ya completaste toda la fase de grupos."
              : `Todavia te faltan ${preTournamentSummary.remainingMatches} partidos para cerrar tu simulacion grupo por grupo.`}
          </p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card style={{ gap: spacing[8], padding: spacing[16] }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>Cargando tus grupos proyectados</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
            Estamos armando la tabla segun tus predicciones guardadas.
          </p>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar Tu Mundial</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: spacing[12] }}>
        {groups.map((group) => (
          <GroupStandingsCard key={group.groupId} group={group} />
        ))}
      </div>
    </div>
  );
}

export function TournamentScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
  const [data, setData] = useState<TuMundialResponse | null>(null);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [marathonStartMatchId, setMarathonStartMatchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTournament() {
      if (status !== "authenticated" || !user) {
        setData(null);
        setPreTournamentSummary(null);
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [nextData, nextSummary, matchesResponse] = await Promise.all([
          getTuMundial(token),
          getPreTournamentSummary(token),
          getMatches(token, { limit: 64 })
        ]);

        if (!cancelled) {
          setData(nextData);
          setPreTournamentSummary(nextSummary);
          setItems(matchesResponse.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos cargar Tu Mundial.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTournament();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const pendingGroupMatches = useMemo(
    () =>
      items
        .filter((match) => match.stage === "group" && match.predictionStatus === "empty")
        .sort(compareMatchesChronologically),
    [items]
  );
  const matchesById = useMemo(() => new Map(items.map((match) => [match.matchId, match])), [items]);
  const firstPendingMatchId = preTournamentSummary?.nextPendingMatchId ?? pendingGroupMatches[0]?.matchId ?? null;

  return (
    <>
      <TournamentScreenView
        errorMessage={errorMessage}
        groups={data?.groups ?? []}
        isLoading={isLoading}
        onContinuePredictions={() => {
          if (firstPendingMatchId) {
            setMarathonStartMatchId(firstPendingMatchId);
            return;
          }

          router.push(APP_ROUTES.home);
        }}
        onOpenHome={() => router.push(APP_ROUTES.home)}
        onOpenMatches={() => router.push(APP_ROUTES.matches)}
        onRetry={() => setReloadKey((current) => current + 1)}
        preTournamentSummary={preTournamentSummary}
        profileDisplayName={profile?.displayName ?? null}
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
