import React, { useMemo } from "react";
import type { BestPlayerPickResponse, ChampionPickResponse, LeagueSummary, MatchSummary, PointsResponse, PreTournamentSummary, SubChampionPickResponse } from "@prode/shared";
import { AdSlotCard, NextMatchHero } from "@prode/ui";
import { HomeSummaryCard } from "./home-summary-card";
import { MisPicksWidget } from "./mis-picks-widget";
import { NextMatchesList } from "./next-matches-list";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { pickContextualHeroMatch } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import {
  pickFinalIfFinished,
  resolveChampionFromFinal
} from "./home-helpers";
import { HomeChampionHero } from "./home-champion-hero";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";

type HomeInTournamentViewProps = {
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

export function HomeInTournamentView({
  profileDisplayName,
  items,
  leagues,
  points,
  championPick,
  subChampionPick,
  bestPlayerPick,
  preTournamentSummary,
  isLoading,
  errorMessage,
  onRetry,
  onOpenMatch,
  onOpenMatches,
  onOpenLeagues,
  onOpenTournament,
  onOpenPicks
}: HomeInTournamentViewProps) {
  const { locale } = useLocale();
  const pendingMatches = useMemo(() => items.filter((match) => canEditPrediction(match)), [items]);
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const finalMatch = useMemo(() => pickFinalIfFinished(items), [items]);
  const champion = useMemo(
    () => (finalMatch ? resolveChampionFromFinal(finalMatch) : null),
    [finalMatch]
  );
  const isPostTournament = finalMatch !== null;
  const hero = useMemo(
    () => (isPostTournament ? null : pickContextualHeroMatch(items, "predictions-first")),
    [items, isPostTournament]
  );
  const heroProps = hero
    ? toHeroProps({
        match: hero.match,
        state: hero.state,
        locale,
        onAction: () => onOpenMatch(hero.match.matchId)
      })
    : null;

  return (
    <div className="grid gap-4">
      {isPostTournament ? (
        <HomeChampionHero
          champion={champion}
          eyebrow={copyForLocale(locale, "CAMPEÓN DEL MUNDIAL 2026", "WORLD CUP 2026 CHAMPION")}
          fallbackText={copyForLocale(locale, "Torneo finalizado", "Tournament finished")}
          ctaLabel={copyForLocale(locale, "Ver resumen del torneo", "See tournament summary")}
          onAction={onOpenTournament}
        />
      ) : heroProps ? (
        <NextMatchHero {...heroProps} />
      ) : null}

      {!isPostTournament ? (
        <NextMatchesList
          items={items}
          excludeMatchId={hero?.match.matchId ?? null}
          onOpenMatch={onOpenMatch}
        />
      ) : null}

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo.", "Reserved slot for native sponsorship.")} />

      <HomeSummaryCard
        points={points}
        leagues={leagues}
        scored={scoredMatches.length}
        pending={pendingMatches.length}
        onOpen={onOpenLeagues}
      />

      <MisPicksWidget
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        onOpenPicks={onOpenPicks}
      />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
