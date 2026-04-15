"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary, type TuMundialGroupCard, type TuMundialResponse } from "@prode/shared";
import { Button, Card, ProgressCompact, StatusTag, TeamDisplay } from "@prode/ui";
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
  onOpenMacroPicks: () => void;
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
      copy: "Todavia no moviste este grupo."
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
    copy: "La tabla sigue viva y todavia puede cambiar."
  };
}

function GroupStandingsCard({ group }: GroupStandingsCardProps) {
  const state = toGroupState(group);

  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="flex justify-between items-start gap-3">
        <div className="grid gap-1">
          <span className="typo-small text-text-muted">{group.groupName}</span>
          <strong className="text-[18px] leading-[1.25] text-text-primary">Asi va quedando la tabla</strong>
          <span className="text-[13px] leading-[1.35] text-text-secondary">
            {group.completedMatches} / {group.totalMatches} partidos proyectados
          </span>
        </div>
        <StatusTag status={state.tone} label={state.label} />
      </div>

      <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{state.copy}</p>

      <div className="grid gap-2 p-3 rounded-[16px] bg-[rgba(255,255,255,0.03)] border border-border-default">
        <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] gap-2 items-center">
          <span className="typo-small text-text-muted">Equipo</span>
          <span className="typo-small text-text-muted text-center">PJ</span>
          <span className="typo-small text-text-muted text-center">DG</span>
          <span className="typo-small text-text-muted text-center">Pts</span>
        </div>

        {group.items.map((item) => (
          <div
            key={item.teamId}
            className={`grid grid-cols-[minmax(0,1fr)_44px_44px_44px] gap-2 items-center px-3 py-2.5 rounded-[14px] ${
              item.isProjectedQualified
                ? "bg-[rgba(47,107,255,0.12)] border border-[rgba(47,107,255,0.22)]"
                : "bg-[rgba(255,255,255,0.02)] border border-border-default"
            }`}
          >
            <div className="grid gap-1">
              <span
                className={`text-[12px] leading-[1.2] ${
                  item.isProjectedQualified ? "text-[#9BE5B6] font-bold" : "text-text-muted font-semibold"
                }`}
              >
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
            <span className="text-[14px] leading-[1.2] text-text-primary text-center">{item.played}</span>
            <span className="text-[14px] leading-[1.2] text-text-primary text-center">{item.goalDifference}</span>
            <span className="text-[14px] leading-[1.2] text-text-primary text-center font-bold">{item.points}</span>
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
  onOpenMacroPicks,
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
    <div className="grid gap-4">
      <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
        <span className="typo-small text-text-muted">TU MUNDIAL</span>
        <div className="grid gap-2">
          <h1 className="typo-h1 m-0 text-text-primary">
            {profileDisplayName ? `${profileDisplayName}, asi se mueve tu Mundial` : "Asi se mueve tu Mundial"}
          </h1>
          <p className="typo-body m-0 text-text-secondary max-w-[620px]">
            {isPreTournament
              ? "Cada prediccion empuja la tabla de su grupo. Aqui ves rapido quienes estarian clasificando segun tu simulacion."
              : "Tus grupos proyectados siguen disponibles aunque el producto ya este priorizando el loop diario del torneo en vivo."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button onClick={isPreTournament ? onContinuePredictions : onOpenHome}>
            {isPreTournament ? "Continuar mis predicciones" : "Volver al home en vivo"}
          </Button>
          <Button variant="secondary" onClick={onOpenMacroPicks}>
            Abrir Macro Picks
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
        <Card elevated style={{ gap: 8, padding: 16 }}>
          <div className="flex justify-between gap-3 items-center">
            <div className="grid gap-1">
              <span className="typo-small text-text-muted">TU AVANCE GLOBAL</span>
              <strong className="text-[20px] leading-[1.2] text-text-primary">
                {preTournamentSummary.completedMatches} / {preTournamentSummary.totalMatches} partidos
              </strong>
            </div>
            <StatusTag
              status={preTournamentSummary.remainingMatches === 0 ? "scored" : "editable"}
              label={`${preTournamentSummary.completionPercentage}%`}
            />
          </div>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            {preTournamentSummary.remainingMatches === 0
              ? "Ya completaste toda la fase de grupos."
              : `Todavia te faltan ${preTournamentSummary.remainingMatches} partidos para cerrar tu simulacion grupo por grupo.`}
          </p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card style={{ gap: 10, padding: 16 }}>
          <div className="w-32 h-[10px] rounded-full bg-[rgba(148,163,184,0.16)]" />
          <div className="w-[68%] h-[14px] rounded-full bg-[rgba(255,255,255,0.05)]" />
          <div className="w-full h-[72px] rounded-[16px] bg-[rgba(255,255,255,0.03)]" />
        </Card>
      ) : null}

      {errorMessage ? (
        <Card style={{ gap: 8, padding: 16, borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong className="text-[16px] text-text-primary">No pudimos cargar Tu Mundial</strong>
          <p className="m-0 text-[14px] leading-[1.45] text-[#F5B4B4]">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-3">
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
        onOpenMacroPicks={() => router.push(APP_ROUTES.macroPicks)}
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
