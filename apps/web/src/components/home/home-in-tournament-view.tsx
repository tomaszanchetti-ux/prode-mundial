import React, { useMemo } from "react";
import type { MatchSummary, PreTournamentSummary } from "@prode/shared";
import { AdSlotCard, Button, Card, NextMatchHero, ProgressCompact, StatusTag } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import {
  pickNextOpeningMatch,
  pickPriorityMatch,
  toCountdownLabel,
  toKickoffLabel,
  toStageLabel,
  toSupportCardTitle,
  toTournamentSupportCopy
} from "./home-helpers";
import { HomeErrorCard, HomeSkeletonCard } from "./home-states";

type HomeInTournamentViewProps = {
  profileDisplayName: string | null;
  items: MatchSummary[];
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
          ctaLabel={priorityMatch.userPredictionSummary ? "Editar prediccion" : "Predecir ahora"}
          eyebrow="PARTIDO DESTACADO"
          helperText={
            priorityMatch.userPredictionSummary
              ? copyForLocale(locale, `Ya guardaste ${priorityMatch.userPredictionSummary}.`, `You already saved ${priorityMatch.userPredictionSummary}.`)
              : copyForLocale(locale, "Tu siguiente prediccion esta lista para resolver.", "Your next prediction is ready to be solved.")
          }
          homeTeam={{
            teamName: priorityMatch.homeTeam.name,
            fifaCode: priorityMatch.homeTeam.fifaCode,
            flagAsset: priorityMatch.homeTeam.flagAsset,
            flagUrl: priorityMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(priorityMatch, locale)} · ${toKickoffLabel(priorityMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(priorityMatch.matchId)}
          onSecondaryAction={onOpenMatches}
          secondaryCtaLabel={copyForLocale(locale, "Ver calendario", "See schedule")}
          status={canEditPrediction(priorityMatch) ? "editable" : "locked"}
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
            <StatusTag status="locked" label={toCountdownLabel(nextOpeningMatch.predictionOpensAt, locale)} />
          </div>

          <Button variant="secondary" onClick={onOpenMatches}>
            {copyForLocale(locale, "Ver calendario", "See schedule")}
          </Button>
        </Card>
      ) : null}

      <ProgressCompact
        items={[
          {
            label: "PUNTUADOS",
            value: String(scoredMatches.length),
            hint: copyForLocale(locale, "ya resueltos", "already scored")
          },
          {
            label: "PENDIENTES",
            value: String(pendingMatches.length),
            hint: copyForLocale(locale, "todavia editables", "still editable")
          },
          {
            label: "GUARDADOS",
            value: String(savedEditableMatches.length),
            hint: copyForLocale(locale, "para revisar", "ready to review")
          }
        ]}
      />

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card elevated style={{ gap: 10 }}>
          <div className="flex justify-between gap-3 items-center">
            <div className="grid gap-1">
              <span className="typo-small text-text-muted">TU LIGA HOY</span>
              <h2 className="typo-h3 m-0 text-text-primary">
                {toSupportCardTitle(preTournamentSummary, profileDisplayName, locale)}
              </h2>
            </div>
          </div>
          <p className="typo-body m-0 text-text-secondary">
            {copyForLocale(locale, "Revisa como viene tu competencia y vuelve rapido a tu siguiente partido.", "Check how your competition stands and jump back into your next match.")}
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={onOpenRankings}>
              {copyForLocale(locale, "Ver tabla", "See table")}
            </Button>
            <Button variant="ghost" onClick={onOpenLeagues}>
              {copyForLocale(locale, "Ver mis ligas", "See my leagues")}
            </Button>
          </div>
        </Card>

        <Card elevated style={{ gap: 10 }}>
          <div className="grid gap-1">
            <span className="typo-small text-text-muted">TU MUNDIAL</span>
            <h2 className="typo-h3 m-0 text-text-primary">
              {copyForLocale(locale, "Sigue disponible", "Still available")}
            </h2>
          </div>
          <p className="typo-body m-0 text-text-secondary">{toTournamentSupportCopy(preTournamentSummary, locale)}</p>
          <Button variant="ghost" onClick={onOpenTournament}>
            {copyForLocale(locale, "Abrir Tu Mundial", "Open Your World Cup")}
          </Button>
        </Card>
      </div>

      <AdSlotCard description={copyForLocale(locale, "Espacio reservado para patrocinio nativo, ubicado despues del bloque principal.", "Reserved slot for native sponsorship, placed after the main block.")} />

      {errorMessage ? <HomeErrorCard message={errorMessage} onRetry={onRetry} /> : null}
      {isLoading ? <HomeSkeletonCard /> : null}
    </div>
  );
}
