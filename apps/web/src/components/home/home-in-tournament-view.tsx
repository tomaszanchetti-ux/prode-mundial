import React, { useMemo } from "react";
import type { ChampionPickResponse, LeagueSummary, MatchSummary, PointsResponse, PreTournamentSummary, SubChampionPickResponse } from "@prode/shared";
import { AdSlotCard, Card, NextMatchHero } from "@prode/ui";
import { MiScoreWidget } from "./mi-score-widget";
import { MisPicksWidget } from "./mis-picks-widget";
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

  const scored = scoredMatches.length;
  const pending = pendingMatches.length;
  const totalRelevant = scored + pending;
  const percentage = totalRelevant > 0 ? Math.round((scored / totalRelevant) * 100) : 0;

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

      <MiScoreWidget points={points} leagues={leagues} onOpenLeagues={onOpenLeagues} />

      <MisPicksWidget
        championPick={championPick}
        subChampionPick={subChampionPick}
        onOpenPicks={onOpenPicks}
      />

      <Card elevated style={{ gap: 8, padding: 12 }}>
        <div className="h-1.5 w-full rounded-pill bg-bg-muted overflow-hidden">
          <div
            className="h-full bg-success rounded-pill transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2 typo-small">
          <span className="text-text-primary font-semibold">
            {scored} {copyForLocale(locale, "puntuados", "scored")}
            <span className="text-text-muted font-normal"> · {pending} {copyForLocale(locale, "pendientes", "pending")}</span>
          </span>
          <span className="text-text-muted">{percentage}%</span>
        </div>
      </Card>

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues del bloque principal.", "Reserved slot for native sponsorship, placed after the main block.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
