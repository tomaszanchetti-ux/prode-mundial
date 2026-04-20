import React from "react";
import type { ChampionPickResponse, LeagueSummary, MatchSummary, PointsResponse, PreTournamentSummary, SubChampionPickResponse } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { pickContextualHeroMatch } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";
import { MiScoreWidget } from "./mi-score-widget";
import { MisPicksWidget } from "./mis-picks-widget";

type HomePreTournamentViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  leagues: LeagueSummary[];
  points: PointsResponse | null;
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  preTournamentSummary: PreTournamentSummary;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenTournament: () => void;
};

export function HomePreTournamentView({
  profileDisplayName,
  items,
  leagues,
  points,
  championPick,
  subChampionPick,
  preTournamentSummary,
  isLoading,
  errorMessage,
  onRetry,
  onOpenMatch,
  onOpenMatches,
  onOpenLeagues,
  onOpenTournament
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
        <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
          <span className="typo-small text-text-muted">MI MUNDIAL</span>
          <h1 className="typo-h1 m-0 text-text-primary">
            {copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
          </h1>
          <div className="flex gap-2.5 flex-wrap">
            <Button onClick={onOpenMatches}>{copyForLocale(locale, "Ver calendario", "See schedule")}</Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Ir a Mi Mundial", "Go to My World Cup")}
            </Button>
          </div>
        </Card>
      )}

      <Card elevated style={{ gap: 8, padding: 12 }}>
        <div className="h-1.5 w-full rounded-pill bg-bg-muted overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-pill transition-[width] duration-300"
            style={{ width: `${preTournamentSummary.completionPercentage}%` }}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2 typo-small">
          <span className="text-text-primary font-semibold">
            {preTournamentSummary.completedMatches} {copyForLocale(locale, "hechos", "filled")}
            <span className="text-text-muted font-normal"> · {preTournamentSummary.remainingMatches} {copyForLocale(locale, "pendientes", "pending")}</span>
          </span>
          <span className="text-text-muted">{preTournamentSummary.completionPercentage}%</span>
        </div>
      </Card>

      <MiScoreWidget points={points} leagues={leagues} onOpenLeagues={onOpenLeagues} />

      <MisPicksWidget
        championPick={championPick}
        subChampionPick={subChampionPick}
        onOpenPicks={onOpenTournament}
      />

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues de la accion principal.", "Reserved slot for native sponsorship, placed after the main action.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
