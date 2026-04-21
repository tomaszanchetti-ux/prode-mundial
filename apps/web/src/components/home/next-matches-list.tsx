import React, { useMemo } from "react";
import type { MatchSummary } from "@prode/shared";
import { Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { MatchRow } from "@/components/matches/match-row";
import { compareMatchesChronologically } from "./home-helpers";

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
            <MatchRow match={match} locale={locale} onClick={() => onOpenMatch(match.matchId)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
