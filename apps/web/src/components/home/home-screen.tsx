"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES, type BestPlayerPickResponse, type ChampionPickResponse, type LeagueSummary, type MatchSummary, type PointsResponse, type PreTournamentSummary, type SubChampionPickResponse } from "@prode/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { NotifHomeCard } from "@/components/notifications/notif-home-card";
import { DoubleDismissModal } from "@/components/permissions/double-dismiss-modal";
import { InstallHomeCard } from "@/components/pwa/install-home-card";
import { ApiClientError, getBestPlayerPick, getChampionPick, getMatches, getMyLeagues, getPoints, getPreTournamentSummary, getSubChampionPick } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { compareMatchesChronologically, pickPriorityMatch } from "./home-helpers";
import { HomeInTournamentView } from "./home-in-tournament-view";
import { HomePreTournamentView } from "./home-pre-tournament-view";

export type HomeScreenViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  leagues: LeagueSummary[];
  points: PointsResponse | null;
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  preTournamentSummary: PreTournamentSummary | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenTournament: () => void;
  onOpenPicks: () => void;
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

const QUICK_CYCLE_DISMISSED_KEY = "prode.home.quickCycleDismissed";

export function HomeScreen() {
  const router = useRouter();
  const { profile, status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [championPick, setChampionPick] = useState<ChampionPickResponse | null>(null);
  const [subChampionPick, setSubChampionPick] = useState<SubChampionPickResponse | null>(null);
  const [bestPlayerPick, setBestPlayerPick] = useState<BestPlayerPickResponse | null>(null);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
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
        const [matchesResponse, summaryResponse, leaguesResponse, pointsResponse, championResponse, subChampionResponse, bestPlayerResponse] = await Promise.all([
          getMatches(token, { limit: 120 }),
          getPreTournamentSummary(token),
          getMyLeagues(token).catch(() => ({ items: [] as LeagueSummary[] })),
          getPoints(token).catch(() => null),
          getChampionPick(token).catch(() => null),
          getSubChampionPick(token).catch(() => null),
          getBestPlayerPick(token).catch(() => null)
        ]);

        if (!cancelled) {
          setItems(matchesResponse.items);
          setLeagues(leaguesResponse.items);
          setPoints(pointsResponse);
          setChampionPick(championResponse);
          setSubChampionPick(subChampionResponse);
          setBestPlayerPick(bestPlayerResponse);
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

  // Kickoff del primer match del torneo (tournament start). Se usa como
  // re-trigger del NotifHomeCard post-dismiss. Null mientras items carga.
  const tournamentStartAt = useMemo(() => {
    if (items.length === 0) return null;
    const earliest = items.reduce<number | null>((min, m) => {
      const t = new Date(m.kickoffAt).getTime();
      if (!Number.isFinite(t)) return min;
      return min === null || t < min ? t : min;
    }, null);
    return earliest;
  }, [items]);

  useEffect(() => {
    if (isLoading || dismissedCycle || activeMatchId || !priorityMatch || preTournamentSummary?.isPreTournament) {
      return;
    }

    if (priorityMatch.predictionStatus !== "empty") {
      return;
    }

    if (window.sessionStorage.getItem(QUICK_CYCLE_DISMISSED_KEY) === "1") {
      return;
    }

    setActiveMatchId(priorityMatch.matchId);
  }, [activeMatchId, dismissedCycle, isLoading, preTournamentSummary?.isPreTournament, priorityMatch]);

  const dismissQuickCycle = () => {
    setActiveMatchId(null);
    setDismissedCycle(true);
    try {
      window.sessionStorage.setItem(QUICK_CYCLE_DISMISSED_KEY, "1");
    } catch {
      // sessionStorage puede no estar disponible (modo privado); el estado local alcanza.
    }
  };

  return (
    <>
      <div className="grid gap-4">
        <NotifHomeCard user={user} tournamentStartAt={tournamentStartAt} />
        <HomeScreenView
        profileDisplayName={profile?.displayName ?? null}
        items={items}
        leagues={leagues}
        points={points}
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        preTournamentSummary={preTournamentSummary}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((current) => current + 1)}
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onOpenMatches={() => router.push(APP_ROUTES.tournament)}
        onOpenLeagues={() => router.push(APP_ROUTES.leagues)}
        onOpenTournament={() => router.push(APP_ROUTES.tournament)}
        onOpenPicks={() => router.push(APP_ROUTES.picks)}
      />
        <InstallHomeCard />
      </div>

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={
          items.filter(
            (m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId
          ).length > 0
        }
        onClose={dismissQuickCycle}
        onSaved={() => {
          const pendingMatches = items
            .filter((m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId)
            .sort(compareMatchesChronologically);
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            dismissQuickCycle();
          }
          setReloadKey((current) => current + 1);
        }}
        onSkip={() => {
          const pendingMatches = items
            .filter((m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId)
            .sort(compareMatchesChronologically);
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            dismissQuickCycle();
          }
        }}
      />

      <DoubleDismissModal />
    </>
  );
}
