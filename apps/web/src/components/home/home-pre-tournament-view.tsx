import React from "react";
import type { LeagueSummary, MatchSummary, PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import {
  pickPriorityMatch,
  toCompletionCopy,
  toCountdownLabel,
  toKickoffLabel,
  toLeagueSummaryCopy,
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
  // Usa pickPriorityMatch (ordena por kickoff, considera todos los partidos editables)
  // en vez de preTournamentSummary.nextPendingMatchId del backend, que solo mira grupos
  // sin ordenar cronológicamente.
  const nextPreTournamentMatch = pickPriorityMatch(items);

  return (
    <div className="grid gap-4">
      {nextPreTournamentMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: nextPreTournamentMatch.awayTeam.name,
            fifaCode: nextPreTournamentMatch.awayTeam.fifaCode,
            flagAsset: nextPreTournamentMatch.awayTeam.flagAsset,
            flagUrl: nextPreTournamentMatch.awayTeam.flagUrl
          }}
          ctaLabel={nextPreTournamentMatch.userPredictionSummary
            ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
            : copyForLocale(locale, "Seguir completando", "Continue filling")}
          eyebrow={`${toStageLabel(nextPreTournamentMatch, locale)} · ${toKickoffLabel(nextPreTournamentMatch.kickoffAt, locale)}`}
          helperText={
            nextPreTournamentMatch.userPredictionSummary
              ? copyForLocale(locale, `Guardaste ${nextPreTournamentMatch.userPredictionSummary}`, `You saved ${nextPreTournamentMatch.userPredictionSummary}`)
              : !canEditPrediction(nextPreTournamentMatch)
                ? copyForLocale(locale, `Abre ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}`, `Opens ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}`)
                : undefined
          }
          homeTeam={{
            teamName: nextPreTournamentMatch.homeTeam.name,
            fifaCode: nextPreTournamentMatch.homeTeam.fifaCode,
            flagAsset: nextPreTournamentMatch.homeTeam.flagAsset,
            flagUrl: nextPreTournamentMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(nextPreTournamentMatch, locale)} · ${toKickoffLabel(nextPreTournamentMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(nextPreTournamentMatch.matchId)}
          status={canEditPrediction(nextPreTournamentMatch) ? "editable" : "locked"}
          statusLabel={canEditPrediction(nextPreTournamentMatch) ? copyForLocale(locale, "Listo", "Ready") : toCountdownLabel(nextPreTournamentMatch.predictionOpensAt, locale)}
          title={`${nextPreTournamentMatch.homeTeam.name} vs ${nextPreTournamentMatch.awayTeam.name}`}
        />
      ) : (
        <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
          <span className="typo-small text-text-muted">TU MUNDIAL</span>
          <h1 className="typo-h1 m-0 text-text-primary">
            {copyForLocale(locale, "Completa tu Mundial", "Complete your World Cup")}
          </h1>
          <p className="typo-body m-0 text-text-secondary max-w-[560px]">{toCompletionCopy(preTournamentSummary, locale)}</p>
          <div className="flex gap-2.5 flex-wrap">
            <Button onClick={onOpenMatches}>{copyForLocale(locale, "Ver calendario", "See schedule")}</Button>
            <Button variant="ghost" onClick={onOpenTournament}>
              {copyForLocale(locale, "Ir a Tu Mundial", "Go to Your World Cup")}
            </Button>
          </div>
        </Card>
      )}

      <ProgressCompact
        items={[
          {
            label: copyForLocale(locale, "CARGADOS", "FILLED"),
            value: String(preTournamentSummary.completedMatches),
            tone: "success"
          },
          {
            label: copyForLocale(locale, "PENDIENTES", "PENDING"),
            value: String(preTournamentSummary.remainingMatches),
            tone: "primary"
          },
          {
            label: copyForLocale(locale, "AVANCE", "PROGRESS"),
            value: `${preTournamentSummary.completionPercentage}%`,
            tone: "warning"
          }
        ]}
      />

      {leagues.length > 0 ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU LIGA HOY", "YOUR LEAGUE TODAY")}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="typo-h3 m-0 text-text-primary">{leagues[0].name}</h2>
            <span className="typo-small text-text-muted">
              {leagues[0].membersCount} {copyForLocale(locale, "jugadores", "players")}
            </span>
          </div>
          <p className="typo-body m-0 text-text-secondary">{toLeagueSummaryCopy(preTournamentSummary, locale)}</p>
          <div className="flex gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={onOpenRankings}>
              {copyForLocale(locale, "Ver tabla", "See table")}
            </Button>
            <Button variant="ghost" onClick={onOpenLeagues}>
              {copyForLocale(locale, "Invitar amigos", "Invite friends")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU LIGA HOY", "YOUR LEAGUE TODAY")}
          </span>
          <p className="typo-body m-0 text-text-secondary">
            {copyForLocale(locale, "Crea una liga e invita amigos para competir.", "Create a league and invite friends to compete.")}
          </p>
          <Button variant="secondary" onClick={onOpenLeagues}>
            {copyForLocale(locale, "Crear liga", "Create league")}
          </Button>
        </Card>
      )}

      <Card elevated style={{ gap: 8, padding: 16 }}>
        <div className="flex justify-between items-center">
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU MUNDIAL", "YOUR WORLD CUP")}
          </span>
          <Button variant="ghost" onClick={onOpenTournament}>
            {copyForLocale(locale, "Ver grupos y llaves", "See groups & bracket")}
          </Button>
        </div>
      </Card>

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues de la accion principal.", "Reserved slot for native sponsorship, placed after the main action.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
