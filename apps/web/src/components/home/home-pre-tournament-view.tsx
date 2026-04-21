import React from "react";
import type { BestPlayerPickResponse, ChampionPickResponse, LeagueSummary, MatchSummary, PointsResponse, PreTournamentSummary, SubChampionPickResponse } from "@prode/shared";
import { AdSlotCard, Card, NextMatchHero } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { pickContextualHeroMatch } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";
import { HomeSummaryCard } from "./home-summary-card";
import { MisPicksWidget } from "./mis-picks-widget";
import { NextMatchesList } from "./next-matches-list";

type HomePreTournamentViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  leagues: LeagueSummary[];
  points: PointsResponse | null;
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  preTournamentSummary: PreTournamentSummary;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenTournament: () => void;
  onOpenPicks: () => void;
};

export function HomePreTournamentView({
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
}: HomePreTournamentViewProps) {
  const { locale } = useLocale();
  const hero = pickContextualHeroMatch(items, "predictions-first");
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
      {heroProps ? (
        <NextMatchHero {...heroProps} />
      ) : (
        <Card
          as="button"
          type="button"
          elevated
          onClick={onOpenTournament}
          aria-label={copyForLocale(locale, "Ir a Predicciones", "Go to Predictions")}
          className="hero-worldcup-bg text-left w-full cursor-pointer"
          style={{ gap: 8, padding: 20 }}
        >
          <span className="typo-eyebrow">
            {copyForLocale(locale, "PREDICCIONES", "PREDICTIONS")}
          </span>
          <h1 className="typo-h1 m-0 text-text-primary">
            {copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
          </h1>
        </Card>
      )}

      <NextMatchesList
        items={items}
        excludeMatchId={hero?.match.matchId ?? null}
        onOpenMatch={onOpenMatch}
      />

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo.", "Reserved slot for native sponsorship.")} />

      <HomeSummaryCard
        points={points}
        leagues={leagues}
        scored={preTournamentSummary.completedMatches}
        pending={preTournamentSummary.remainingMatches}
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
