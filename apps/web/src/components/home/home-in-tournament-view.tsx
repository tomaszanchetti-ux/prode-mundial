import React, { useMemo } from "react";
import type { LeagueSummary, MatchSummary, PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import {
  pickNextChronologicalMatch,
  pickPriorityMatch,
  toEditWindowLabel,
  toKickoffLabel,
  toStageLabel
} from "./home-helpers";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";

type HomeInTournamentViewProps = {
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

export function HomeInTournamentView({
  profileDisplayName,
  items,
  leagues,
  preTournamentSummary,
  isLoading,
  errorMessage,
  onRetry,
  onOpenMatch,
  onOpenMatches,
  onOpenLeagues,
  onOpenRankings,
  onOpenTournament
}: HomeInTournamentViewProps) {
  const { locale } = useLocale();
  const pendingMatches = useMemo(() => items.filter((match) => canEditPrediction(match)), [items]);
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const upcomingMatch = useMemo(() => pickNextChronologicalMatch(items), [items]);
  const heroMatch = priorityMatch ?? upcomingMatch;
  const heroIsEditable = heroMatch ? canEditPrediction(heroMatch) : false;
  const heroHasPrediction = Boolean(heroMatch?.userPredictionSummary);

  const heroCtaLabel = heroMatch
    ? heroHasPrediction
      ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
      : heroIsEditable
        ? copyForLocale(locale, "Predecir ahora", "Predict now")
        : copyForLocale(locale, "Ver partido", "See match")
    : "";

  const heroHelperText = heroMatch
    ? heroHasPrediction
      ? heroIsEditable
        ? copyForLocale(
            locale,
            `Tu prediccion: ${heroMatch.userPredictionSummary} · ${toEditWindowLabel(heroMatch.deadlineAt, locale)}`,
            `Your prediction: ${heroMatch.userPredictionSummary} · ${toEditWindowLabel(heroMatch.deadlineAt, locale)}`
          )
        : copyForLocale(
            locale,
            `Tu prediccion: ${heroMatch.userPredictionSummary}`,
            `Your prediction: ${heroMatch.userPredictionSummary}`
          )
      : heroIsEditable
        ? undefined
        : copyForLocale(
            locale,
            `Abre ${toKickoffLabel(heroMatch.predictionOpensAt, locale)}`,
            `Opens ${toKickoffLabel(heroMatch.predictionOpensAt, locale)}`
          )
    : undefined;

  const heroStatus: "saved" | "editable" | "neutral" = heroIsEditable
    ? heroHasPrediction
      ? "saved"
      : "editable"
    : "neutral";

  const heroStatusLabel = heroMatch
    ? heroStatus === "saved"
      ? copyForLocale(locale, "Guardado", "Saved")
      : heroStatus === "editable"
        ? copyForLocale(locale, "Pendiente", "Pending")
        : copyForLocale(locale, "Cerrado", "Locked")
    : "";

  const scored = scoredMatches.length;
  const pending = pendingMatches.length;
  const totalRelevant = scored + pending;
  const percentage = totalRelevant > 0 ? Math.round((scored / totalRelevant) * 100) : 0;

  return (
    <div className="grid gap-4">
      {heroMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: heroMatch.awayTeam.name,
            fifaCode: heroMatch.awayTeam.fifaCode,
            flagAsset: heroMatch.awayTeam.flagAsset,
            flagUrl: heroMatch.awayTeam.flagUrl
          }}
          ctaLabel={heroCtaLabel}
          eyebrow={`${toStageLabel(heroMatch, locale)} · ${toKickoffLabel(heroMatch.kickoffAt, locale)}`}
          helperText={heroHelperText}
          homeTeam={{
            teamName: heroMatch.homeTeam.name,
            fifaCode: heroMatch.homeTeam.fifaCode,
            flagAsset: heroMatch.homeTeam.flagAsset,
            flagUrl: heroMatch.homeTeam.flagUrl
          }}
          onAction={() => onOpenMatch(heroMatch.matchId)}
          status={heroStatus}
          statusLabel={heroStatusLabel}
          title={`${heroMatch.homeTeam.name} vs ${heroMatch.awayTeam.name}`}
        />
      ) : null}

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

      {leagues.length > 0 ? (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU LIGA HOY", "YOUR LEAGUE TODAY")}
          </span>
          <h2 className="typo-h3 m-0 text-text-primary">{leagues[0].name}</h2>
          <p className="typo-small text-text-secondary m-0">
            {leagues[0].position != null ? (
              <>
                <span className="text-text-primary font-semibold">#{leagues[0].position}</span>
                <span className="text-text-muted"> · {leagues[0].userPoints} {copyForLocale(locale, "pts", "pts")}</span>
              </>
            ) : null}
            <span className="text-text-muted">
              {leagues[0].position != null ? " · " : ""}{leagues[0].membersCount} {copyForLocale(locale, "jugadores", "players")}
            </span>
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={onOpenRankings}>
              {copyForLocale(locale, "Ver tabla", "See table")}
            </Button>
            <Button variant="ghost" onClick={onOpenLeagues}>
              {copyForLocale(locale, "Invitar", "Invite")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU LIGA HOY", "YOUR LEAGUE TODAY")}
          </span>
          <Button variant="secondary" onClick={onOpenLeagues}>
            {copyForLocale(locale, "Crear liga", "Create league")}
          </Button>
        </Card>
      )}

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues del bloque principal.", "Reserved slot for native sponsorship, placed after the main block.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
