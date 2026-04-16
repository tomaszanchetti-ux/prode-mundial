"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type LeagueSummary, type MatchSummary, type PreTournamentSummary } from "@prode/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { MarathonPredictionModal } from "@/components/matches/marathon-prediction-modal";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getMatches, getMyLeagues, getPreTournamentSummary } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { compareMatchesChronologically, pickPriorityMatch } from "./home-helpers";
import { HomeInTournamentView } from "./home-in-tournament-view";
import { HomePreTournamentView } from "./home-pre-tournament-view";

export type HomeScreenViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  leagues: LeagueSummary[];
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

export function HomeScreenView(props: HomeScreenViewProps) {
  if (props.preTournamentSummary?.isPreTournament) {
    return (
      <HomePreTournamentView
        {...props}
        preTournamentSummary={props.preTournamentSummary}
      />
    );
  }

  return <HomeInTournamentView {...props} />;
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
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
        const [matchesResponse, summaryResponse, leaguesResponse] = await Promise.all([
          getMatches(token, { limit: 100 }),
          getPreTournamentSummary(token),
          getMyLeagues(token).catch(() => ({ items: [] as LeagueSummary[] }))
        ]);

        if (!cancelled) {
          setItems(matchesResponse.items);
          setLeagues(leaguesResponse.items);
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
        .filter((match) => match.stage === "group" && match.status === "scheduled" && !match.isFinished && match.predictionStatus !== "scored" && canEditPrediction(match))
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
        leagues={leagues}
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
        hasNextPending={items.filter((m) => canEditPrediction(m) && m.matchId !== activeMatchId).length > 0}
        onClose={() => {
          setActiveMatchId(null);
          setDismissedCycle(true);
        }}
        onSaved={() => {
          // Auto-advance: find next pending match after the current one
          const editableMatches = items
            .filter((m) => canEditPrediction(m) && m.matchId !== activeMatchId)
            .sort(compareMatchesChronologically);
          const nextMatch = editableMatches.find((m) => m.predictionStatus === "empty") ?? editableMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            setActiveMatchId(null);
            setDismissedCycle(true);
          }
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
