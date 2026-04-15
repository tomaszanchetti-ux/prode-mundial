import React from "react";
import type { MatchSummary, PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import {
  toCompletionCopy,
  toCountdownLabel,
  toKickoffLabel,
  toLeagueSummaryCopy,
  toStageLabel,
  toSupportCardTitle,
  toTournamentSupportCopy
} from "./home-helpers";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";

type HomePreTournamentViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
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
  const nextPreTournamentMatch =
    items.find((match) => match.matchId === preTournamentSummary.nextPendingMatchId) ?? null;

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
          ctaLabel={nextPreTournamentMatch.userPredictionSummary ? "Editar prediccion" : "Seguir completando"}
          eyebrow="SIGUE TU MUNDIAL"
          helperText={
            nextPreTournamentMatch.userPredictionSummary
              ? copyForLocale(locale, `Ya guardaste ${nextPreTournamentMatch.userPredictionSummary}.`, `You already saved ${nextPreTournamentMatch.userPredictionSummary}.`)
              : canEditPrediction(nextPreTournamentMatch)
                ? copyForLocale(locale, "Tu siguiente partido ya esta listo para cargar.", "Your next match is ready to fill right now.")
                : copyForLocale(locale, `La ventana abre ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}.`, `The window opens ${toKickoffLabel(nextPreTournamentMatch.predictionOpensAt, locale)}.`)
          }
          homeTeam={{
            teamName: nextPreTournamentMatch.homeTeam.name,
            fifaCode: nextPreTournamentMatch.homeTeam.fifaCode,
            flagAsset: nextPreTournamentMatch.homeTeam.flagAsset,
            flagUrl: nextPreTournamentMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(nextPreTournamentMatch, locale)} · ${toKickoffLabel(nextPreTournamentMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(nextPreTournamentMatch.matchId)}
          onSecondaryAction={onOpenMatches}
          secondaryCtaLabel={copyForLocale(locale, "Ver calendario", "See schedule")}
          status={canEditPrediction(nextPreTournamentMatch) ? "editable" : "locked"}
          statusLabel={canEditPrediction(nextPreTournamentMatch) ? copyForLocale(locale, "Listo para cargar", "Ready to fill") : toCountdownLabel(nextPreTournamentMatch.predictionOpensAt, locale)}
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
            label: "CARGADOS",
            value: String(preTournamentSummary.completedMatches),
            hint: `de ${preTournamentSummary.totalMatches}`
          },
          {
            label: "PENDIENTES",
            value: String(preTournamentSummary.remainingMatches),
            hint: copyForLocale(locale, "por completar", "left to fill")
          },
          {
            label: "AVANCE",
            value: `${preTournamentSummary.completionPercentage}%`,
            hint: copyForLocale(locale, "tu simulacion", "your run")
          }
        ]}
      />

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card elevated style={{ gap: 10 }}>
          <div className="grid gap-1">
            <span className="typo-small text-text-muted">TU LIGA HOY</span>
            <h2 className="typo-h3 m-0 text-text-primary">
              {toSupportCardTitle(preTournamentSummary, profileDisplayName, locale)}
            </h2>
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

        <Card elevated style={{ gap: 10 }}>
          <div className="grid gap-1">
            <span className="typo-small text-text-muted">TU MUNDIAL</span>
            <h2 className="typo-h3 m-0 text-text-primary">
              {copyForLocale(locale, "Sigue tomando forma", "It keeps taking shape")}
            </h2>
          </div>
          <p className="typo-body m-0 text-text-secondary">{toTournamentSupportCopy(preTournamentSummary, locale)}</p>
          <Button variant="ghost" onClick={onOpenTournament}>
            {copyForLocale(locale, "Abrir Tu Mundial", "Open Your World Cup")}
          </Button>
        </Card>
      </div>

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues de la accion principal.", "Reserved slot for native sponsorship, placed after the main action.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
