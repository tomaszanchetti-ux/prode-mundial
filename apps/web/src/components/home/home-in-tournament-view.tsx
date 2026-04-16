import React, { useMemo } from "react";
import type { LeagueSummary, MatchSummary, PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact, StatusTag } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import {
  pickNextOpeningMatch,
  pickPriorityMatch,
  toCountdownLabel,
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
  const savedEditableMatches = useMemo(
    () => items.filter((match) => canEditPrediction(match) && match.predictionStatus === "saved_editable"),
    [items]
  );
  const scoredMatches = useMemo(() => items.filter((match) => match.predictionStatus === "scored"), [items]);
  const priorityMatch = useMemo(() => pickPriorityMatch(items), [items]);
  const nextOpeningMatch = useMemo(() => pickNextOpeningMatch(items), [items]);

  return (
    <div className="grid gap-4">
      {priorityMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: priorityMatch.awayTeam.name,
            fifaCode: priorityMatch.awayTeam.fifaCode,
            flagAsset: priorityMatch.awayTeam.flagAsset,
            flagUrl: priorityMatch.awayTeam.flagUrl
          }}
          ctaLabel={priorityMatch.userPredictionSummary
            ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
            : copyForLocale(locale, "Predecir ahora", "Predict now")}
          eyebrow={`${toStageLabel(priorityMatch, locale)} · ${toKickoffLabel(priorityMatch.kickoffAt, locale)}`}
          helperText={
            priorityMatch.userPredictionSummary
              ? copyForLocale(locale, `Guardaste ${priorityMatch.userPredictionSummary}`, `You saved ${priorityMatch.userPredictionSummary}`)
              : undefined
          }
          homeTeam={{
            teamName: priorityMatch.homeTeam.name,
            fifaCode: priorityMatch.homeTeam.fifaCode,
            flagAsset: priorityMatch.homeTeam.flagAsset,
            flagUrl: priorityMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(priorityMatch, locale)} · ${toKickoffLabel(priorityMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(priorityMatch.matchId)}
          status={canEditPrediction(priorityMatch) ? "editable" : "neutral"}
          statusLabel={canEditPrediction(priorityMatch) ? copyForLocale(locale, "Pendiente", "Pending") : copyForLocale(locale, "Cerrado", "Locked")}
          title={`${priorityMatch.homeTeam.name} vs ${priorityMatch.awayTeam.name}`}
        />
      ) : null}

      {!priorityMatch && nextOpeningMatch ? (
        <Card elevated style={{ gap: 16, padding: 18 }}>
          <div className="grid gap-1.5">
            <span className="typo-small text-gold">PROXIMA VENTANA</span>
            <h1 className="typo-h2 m-0 text-text-primary">
              {copyForLocale(locale, "Tu siguiente prediccion abre pronto", "Your next prediction opens soon")}
            </h1>
            <p className="typo-body m-0 text-text-secondary max-w-[560px]">
              {nextOpeningMatch.homeTeam.name} vs {nextOpeningMatch.awayTeam.name} · {toStageLabel(nextOpeningMatch, locale)}
            </p>
          </div>

          <div className="flex justify-between gap-3 items-center flex-wrap">
            <span className="text-[14px] leading-[1.4] text-text-secondary">
              {copyForLocale(locale, "Se habilita", "It opens")} {toKickoffLabel(nextOpeningMatch.predictionOpensAt, locale)}
            </span>
            <StatusTag status="neutral" label={toCountdownLabel(nextOpeningMatch.predictionOpensAt, locale)} />
          </div>

          <Button variant="secondary" onClick={onOpenMatches}>
            {copyForLocale(locale, "Ver calendario", "See schedule")}
          </Button>
        </Card>
      ) : null}

      <ProgressCompact
        items={[
          {
            label: copyForLocale(locale, "PUNTUADOS", "SCORED"),
            value: String(scoredMatches.length),
            tone: "success"
          },
          {
            label: copyForLocale(locale, "PENDIENTES", "PENDING"),
            value: String(pendingMatches.length),
            tone: "primary"
          },
          {
            label: copyForLocale(locale, "GUARDADOS", "SAVED"),
            value: String(savedEditableMatches.length),
            tone: "warning"
          }
        ]}
      />

      {leagues.length > 0 ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <span className="typo-eyebrow text-text-muted uppercase">
            {copyForLocale(locale, "TU LIGA HOY", "YOUR LEAGUE TODAY")}
          </span>

          {leagues.slice(0, 1).map((league) => (
            <div key={league.leagueId} className="grid gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="typo-h3 m-0 text-text-primary">{league.name}</h2>
                <span className="typo-small text-text-muted">
                  {league.membersCount} {copyForLocale(locale, "jugadores", "players")}
                </span>
              </div>

              {league.position != null ? (
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center">
                    <strong className="text-[28px] leading-none text-primary-500 tracking-tight">
                      #{league.position}
                    </strong>
                    <span className="typo-eyebrow text-text-muted">
                      {copyForLocale(locale, "POSICIÓN", "POSITION")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <strong className="text-[28px] leading-none text-text-primary tracking-tight">
                      {league.userPoints}
                    </strong>
                    <span className="typo-eyebrow text-text-muted">
                      {copyForLocale(locale, "PUNTOS", "POINTS")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

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

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues del bloque principal.", "Reserved slot for native sponsorship, placed after the main block.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
