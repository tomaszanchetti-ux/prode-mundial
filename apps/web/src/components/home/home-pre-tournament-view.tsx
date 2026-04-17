import React from "react";
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

type HomePreTournamentViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
  leagues: LeagueSummary[];
  preTournamentSummary: PreTournamentSummary;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLeagues: () => void;
  onOpenRankings: () => void;
  onOpenTournament: () => void;
};

export function HomePreTournamentView({
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
}: HomePreTournamentViewProps) {
  const { locale } = useLocale();
  // Hero: prioriza el próximo pendiente (empty/saved_editable). Si no hay, muestra el
  // próximo partido cronológico (ya predicho o no) para que el hero siempre tenga valor.
  const priorityMatch = pickPriorityMatch(items);
  const upcomingMatch = pickNextChronologicalMatch(items);
  const heroMatch = priorityMatch ?? upcomingMatch;
  const heroIsEditable = heroMatch ? canEditPrediction(heroMatch) : false;
  const heroHasPrediction = Boolean(heroMatch?.userPredictionSummary);

  const heroCtaLabel = heroMatch
    ? heroHasPrediction
      ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
      : copyForLocale(locale, "Seguir completando", "Continue filling")
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
            `Tu prediccion: ${heroMatch.userPredictionSummary} · Ventana cerrada`,
            `Your prediction: ${heroMatch.userPredictionSummary} · Edit window closed`
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
      ) : (
        <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
          <span className="typo-small text-text-muted">TU MUNDIAL</span>
          <h1 className="typo-h1 m-0 text-text-primary">
            {copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
          </h1>
          <div className="flex gap-2.5 flex-wrap">
            <Button onClick={onOpenMatches}>{copyForLocale(locale, "Ver calendario", "See schedule")}</Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Ir a Tu Mundial", "Go to Your World Cup")}
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

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues de la accion principal.", "Reserved slot for native sponsorship, placed after the main action.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
