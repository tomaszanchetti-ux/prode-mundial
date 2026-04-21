"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_ROUTES,
  type BestPlayerPickResponse,
  type ChampionPickResponse,
  type MatchStage,
  type MatchSummary,
  type PreTournamentSummary,
  type SubChampionPickResponse,
  type TournamentProjectionResponse,
  type TuMundialGroupCard,
  type TuMundialResponse
} from "@prode/shared";
import { Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getBestPlayerPick, getChampionPick, getMatches, getPreTournamentSummary, getSubChampionPick, getTournamentProjection, getTuMundial } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { pickContextualHeroMatch, type ContextualHero } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { MisPicksSection } from "./mis-picks-section";
import { PhaseKnockoutView } from "./phase-knockout-view";
import { PredictionsGroupsView } from "./predictions-groups-view";
import { PredictionsTabs, type PredictionsTab, type PredictionsTabItem } from "./predictions-tabs";

const KNOCKOUT_STAGES: MatchStage[] = ["R32", "R16", "QF", "SF", "BRONZE", "FINAL"];

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

function countCompleted(matches: MatchSummary[]) {
  return matches.filter(
    (m) =>
      m.predictionStatus === "saved_editable" ||
      m.predictionStatus === "scored" ||
      m.predictionStatus === "locked_unscored"
  ).length;
}

type TournamentScreenViewProps = {
  activeTab: PredictionsTab;
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  errorMessage: string | null;
  groups: TuMundialGroupCard[];
  hero: ContextualHero | null;
  isLoading: boolean;
  knockoutMatches: MatchSummary[];
  matchesByGroupId: Map<string, MatchSummary[]>;
  onHeroAction: () => void;
  onOpenPicks: (tab?: "champion" | "sub-champion" | "best-player") => void;
  onOpenMatch: (matchId: string) => void;
  onRetry: () => void;
  onTabSelect: (tab: PredictionsTab) => void;
  preTournamentSummary: PreTournamentSummary | null;
  tabItems: PredictionsTabItem[];
};

export function TournamentScreenView({
  activeTab,
  championPick,
  subChampionPick,
  bestPlayerPick,
  errorMessage,
  groups,
  hero,
  isLoading,
  knockoutMatches,
  matchesByGroupId,
  onHeroAction,
  onOpenPicks,
  onOpenMatch,
  onRetry,
  onTabSelect,
  tabItems
}: TournamentScreenViewProps) {
  const { locale } = useLocale();

  const heroProps = hero
    ? toHeroProps({
        match: hero.match,
        state: hero.state,
        locale,
        onAction: onHeroAction
      })
    : null;

  return (
    <div className="grid gap-4">
      {heroProps ? (
        <NextMatchHero {...heroProps} />
      ) : (
        <Card elevated className="hero-worldcup-bg" style={{ gap: 8, padding: 20 }}>
          <span className="typo-small text-text-muted">MI MUNDIAL</span>
          <h1 className="typo-h2 m-0 text-text-primary">Todo al dia</h1>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            No tenes predicciones pendientes ahora. Aprovecha para revisar tus tablas o elegir a tu campeon.
          </p>
        </Card>
      )}

      <MisPicksSection
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        onOpenPicks={onOpenPicks}
      />

      <PredictionsTabs items={tabItems} activeTab={activeTab} onSelect={onTabSelect} />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title="No pudimos cargar Predicciones" message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activeTab === "matches" ? (
          <PredictionsGroupsView
            groups={groups}
            matchesByGroupId={matchesByGroupId}
            onOpenMatch={onOpenMatch}
          />
        ) : (
          <PhaseKnockoutView
            matches={knockoutMatches}
            phaseLabel="Knockouts"
            onOpenMatch={onOpenMatch}
          />
        )
      ) : null}
    </div>
  );
}

export function TournamentScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [data, setData] = useState<TuMundialResponse | null>(null);
  const [projection, setProjection] = useState<TournamentProjectionResponse | null>(null);
  const [championPick, setChampionPick] = useState<ChampionPickResponse | null>(null);
  const [subChampionPick, setSubChampionPick] = useState<SubChampionPickResponse | null>(null);
  const [bestPlayerPick, setBestPlayerPick] = useState<BestPlayerPickResponse | null>(null);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PredictionsTab>("matches");

  useEffect(() => {
    let cancelled = false;

    async function loadTournament() {
      if (status !== "authenticated" || !user) {
        setData(null);
        setProjection(null);
        setChampionPick(null);
        setSubChampionPick(null);
        setBestPlayerPick(null);
        setPreTournamentSummary(null);
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [nextData, nextProjection, nextChampion, nextSubChampion, nextBestPlayer, nextSummary, matchesResponse] = await Promise.all([
          getTuMundial(token),
          getTournamentProjection(token),
          getChampionPick(token),
          getSubChampionPick(token),
          getBestPlayerPick(token),
          getPreTournamentSummary(token),
          getMatches(token, { limit: 200 })
        ]);

        if (!cancelled) {
          setData(nextData);
          setProjection(nextProjection);
          setChampionPick(nextChampion);
          setSubChampionPick(nextSubChampion);
          setBestPlayerPick(nextBestPlayer);
          setPreTournamentSummary(nextSummary);
          setItems(matchesResponse.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos cargar Predicciones.");
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

  const sortedItems = useMemo(() => [...items].sort(compareMatchesChronologically), [items]);

  const groupMatches = useMemo(
    () => sortedItems.filter((m) => m.stage === "group"),
    [sortedItems]
  );

  const knockoutMatches = useMemo(
    () => sortedItems.filter((m) => KNOCKOUT_STAGES.includes(m.stage)),
    [sortedItems]
  );

  const matchesByGroupId = useMemo(() => {
    const map = new Map<string, MatchSummary[]>();

    for (const match of groupMatches) {
      if (!match.groupId) {
        continue;
      }

      const bucket = map.get(match.groupId) ?? [];
      bucket.push(match);
      map.set(match.groupId, bucket);
    }

    return map;
  }, [groupMatches]);

  const tabItems = useMemo<PredictionsTabItem[]>(
    () => [
      {
        key: "matches",
        label: "Partidos",
        completed: countCompleted(groupMatches),
        total: groupMatches.length
      },
      {
        key: "knockouts",
        label: "Knockouts",
        completed: countCompleted(knockoutMatches),
        total: knockoutMatches.length
      }
    ],
    [groupMatches, knockoutMatches]
  );

  const hero = useMemo(
    () => pickContextualHeroMatch(sortedItems, "predictions-first"),
    [sortedItems]
  );
  const editableMatches = useMemo(
    () => sortedItems.filter((match) => canEditPrediction(match)),
    [sortedItems]
  );

  const handleHeroAction = () => {
    if (!hero) return;
    setActiveMatchId(hero.match.matchId);
  };

  return (
    <>
      <TournamentScreenView
        activeTab={activeTab}
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        errorMessage={errorMessage}
        groups={data?.groups ?? []}
        hero={hero}
        isLoading={isLoading}
        knockoutMatches={knockoutMatches}
        matchesByGroupId={matchesByGroupId}
        onHeroAction={handleHeroAction}
        onOpenPicks={(tab) =>
          router.push(tab ? `${APP_ROUTES.picks}?tab=${tab}` : APP_ROUTES.picks)
        }
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onRetry={() => setReloadKey((current) => current + 1)}
        onTabSelect={setActiveTab}
        preTournamentSummary={preTournamentSummary}
        tabItems={tabItems}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={
          editableMatches.filter((m) => m.predictionStatus === "empty" && m.matchId !== activeMatchId).length > 0
        }
        onClose={() => setActiveMatchId(null)}
        onSaved={() => {
          const pendingMatches = editableMatches.filter(
            (m) => m.predictionStatus === "empty" && m.matchId !== activeMatchId
          );
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            setActiveMatchId(null);
          }
          setReloadKey((current) => current + 1);
        }}
      />
    </>
  );
}
