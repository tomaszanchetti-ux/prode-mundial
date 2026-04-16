"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type MatchSummary, type PreTournamentSummary, type TuMundialGroupCard, type TuMundialResponse } from "@prode/shared";
import { Button, Card, ErrorCard, ProgressCompact, SkeletonCard, StatusTag } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { MarathonPredictionModal } from "@/components/matches/marathon-prediction-modal";
import { ApiClientError, getMatches, getPreTournamentSummary, getTuMundial } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { GroupStandingsCard } from "./group-standings-card";

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
        <div className="flex items-center gap-3">
          <img src="/mundial/wc2026-logo.png" alt="" width={36} height={36} className="opacity-70" />
          <span className="typo-small text-text-muted">TU MUNDIAL</span>
        </div>
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
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title="No pudimos cargar Tu Mundial" message={errorMessage} onRetry={onRetry} />
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
          getMatches(token, { limit: 100 })
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
        .filter((match) => match.stage === "group" && match.predictionStatus !== "scored" && canEditPrediction(match))
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
