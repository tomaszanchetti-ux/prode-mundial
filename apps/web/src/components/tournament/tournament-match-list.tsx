"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { MatchCard } from "@prode/ui";
import { useLocale, copyForLocale } from "@/lib/i18n/locale-provider";
import {
  toCardTone,
  toLocalKickoffLabel,
  toPredictionCopy,
  toStageLabel,
  toStatusLabel
} from "@/components/matches/matches-helpers";

type TournamentMatchListProps = {
  matches: MatchSummary[];
  onOpenMatch: (matchId: string) => void;
};

export function TournamentMatchList({ matches, onOpenMatch }: TournamentMatchListProps) {
  const { locale } = useLocale();

  return (
    <section className="grid gap-[10px]">
      {matches.map((match) => (
        <MatchCard
          key={match.matchId}
          awayTeam={{
            teamName: match.awayTeam.name,
            fifaCode: match.awayTeam.fifaCode,
            flagAsset: match.awayTeam.flagAsset,
            flagUrl: match.awayTeam.flagUrl
          }}
          ctaLabel={
            match.ctaLabel === "Editar prediccion"
              ? copyForLocale(locale, "Editar prediccion", "Edit prediction")
              : match.ctaLabel === "Predecir"
                ? copyForLocale(locale, "Predecir", "Predict")
                : match.ctaLabel
          }
          homeTeam={{
            teamName: match.homeTeam.name,
            fifaCode: match.homeTeam.fifaCode,
            flagAsset: match.homeTeam.flagAsset,
            flagUrl: match.homeTeam.flagUrl
          }}
          kickoffLabel={toLocalKickoffLabel(match.kickoffAt, locale)}
          onAction={() => onOpenMatch(match.matchId)}
          predictionSummary={toPredictionCopy(match, locale)}
          stage={match.stage}
          groupId={match.groupId}
          stageLabel={toStageLabel(match.stage, match.groupId, locale)}
          status={toCardTone(match)}
          statusLabel={toStatusLabel(match)}
        />
      ))}
    </section>
  );
}
