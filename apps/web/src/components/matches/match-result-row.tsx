"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { TeamIdentity } from "@prode/ui";
import { copyForLocale, useLocale, type AppLocale } from "@/lib/i18n/locale-provider";
import { toKickoffLabel } from "@/components/home/home-helpers";

type MatchResultRowProps = {
  match: MatchSummary;
  locale?: AppLocale;
};

function pointsBadgeClass(points: number): string {
  if (points > 0) return "text-success bg-success-soft";
  return "text-text-muted bg-bg-interactive";
}

function buildPredictionLine(match: MatchSummary, locale: AppLocale): string {
  const summary = match.userPredictionSummary;
  if (!summary) return "";

  const verb = copyForLocale(locale, "Predijiste", "Predicted");
  const pts = match.userPredictionPoints;

  if (match.isScored && pts !== null) {
    const ptsLabel = copyForLocale(locale, `+${pts} pts`, `+${pts} pts`);
    return `${verb} ${summary} · ${ptsLabel}`;
  }

  return `${verb} ${summary}`;
}

export function MatchResultRow({ match, locale: localeProp }: MatchResultRowProps) {
  const { locale: localeFromHook } = useLocale();
  const locale = localeProp ?? localeFromHook;
  const kickoff = toKickoffLabel(match.kickoffAt, locale);
  const hasScore = match.homeScore90 !== null && match.awayScore90 !== null;
  const hasPrediction = match.userPredictionSummary !== null;
  const predictionLine = buildPredictionLine(match, locale);
  const badgeClass =
    hasPrediction && match.isScored && match.userPredictionPoints !== null
      ? pointsBadgeClass(match.userPredictionPoints)
      : "text-text-muted bg-bg-interactive";

  return (
    <div
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="grid w-full gap-1 px-4 py-3 text-left"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="text-[14px] leading-[1.2] text-text-primary font-semibold truncate">
            {match.homeTeam.name}
          </span>
          <TeamIdentity team={match.homeTeam} size="sm" showName={false} />
        </div>
        <div className="flex items-center gap-1.5 min-w-[58px] justify-center tabular-nums font-black text-[18px] leading-none">
          {hasScore ? (
            <>
              <span className="text-text-primary">{match.homeScore90}</span>
              <span className="text-text-muted font-light">–</span>
              <span className="text-text-primary">{match.awayScore90}</span>
            </>
          ) : (
            <>
              <span className="text-text-muted">–</span>
              <span className="text-text-muted opacity-0">–</span>
              <span className="text-text-muted">–</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 justify-start min-w-0">
          <TeamIdentity team={match.awayTeam} size="sm" showName={false} />
          <span className="text-[14px] leading-[1.2] text-text-primary font-semibold truncate">
            {match.awayTeam.name}
          </span>
        </div>
      </div>
      <span className="typo-meta text-center">{kickoff}</span>
      {hasPrediction ? (
        <div className="flex items-center justify-center gap-2 text-[11px] mt-0.5">
          <span
            className={`px-2 py-0.5 rounded-pill font-bold uppercase tracking-wide ${badgeClass}`}
          >
            {predictionLine}
          </span>
        </div>
      ) : null}
    </div>
  );
}
