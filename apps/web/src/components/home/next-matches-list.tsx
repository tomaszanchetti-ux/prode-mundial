import React, { useMemo } from "react";
import type { MatchSummary } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { parsePredictionScore } from "@/lib/hero/to-hero-props";
import { compareMatchesChronologically, toKickoffLabel } from "./home-helpers";

const MAX_ITEMS = 5;

type NextMatchesListProps = {
  items: MatchSummary[];
  excludeMatchId: string | null;
  onOpenMatch: (matchId: string) => void;
};

export function NextMatchesList({ items, excludeMatchId, onOpenMatch }: NextMatchesListProps) {
  const { locale } = useLocale();
  const upcoming = useMemo(
    () =>
      items
        .filter((match) => match.matchId !== excludeMatchId && canEditPrediction(match))
        .sort(compareMatchesChronologically)
        .slice(0, MAX_ITEMS),
    [items, excludeMatchId]
  );

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <Card elevated style={{ padding: 0, gap: 0 }}>
      <span className="typo-eyebrow text-text-muted uppercase px-4 pt-3">
        {copyForLocale(locale, "PROXIMOS", "UPCOMING")}
      </span>
      <ul className="list-none p-0 m-0 grid">
        {upcoming.map((match, idx) => (
          <li
            key={match.matchId}
            className={idx > 0 ? "border-t border-border-subtle" : ""}
          >
            <NextMatchRow match={match} locale={locale} onClick={() => onOpenMatch(match.matchId)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

type NextMatchRowProps = {
  match: MatchSummary;
  locale: ReturnType<typeof useLocale>["locale"];
  onClick: () => void;
};

function NextMatchRow({ match, locale, onClick }: NextMatchRowProps) {
  const score = parsePredictionScore(match.userPredictionSummary);
  const kickoff = toKickoffLabel(match.kickoffAt, locale);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="grid w-full gap-1 px-4 py-3 text-left cursor-pointer hover:bg-bg-interactive transition-colors"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="text-[14px] leading-[1.2] text-text-primary font-semibold truncate">
            {match.homeTeam.name}
          </span>
          <TeamIdentity team={match.homeTeam} size="sm" showName={false} />
        </div>
        <div className="flex items-center gap-1.5 min-w-[58px] justify-center tabular-nums font-black text-[18px] leading-none">
          {score ? (
            <>
              <span className="text-text-primary">{score.home}</span>
              <span className="text-text-muted font-bold">–</span>
              <span className="text-text-primary">{score.away}</span>
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
      <span className="typo-small text-text-muted text-center">{kickoff}</span>
    </button>
  );
}
