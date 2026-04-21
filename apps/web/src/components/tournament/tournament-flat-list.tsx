"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { AdSlotCard, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { MatchRow } from "@/components/matches/match-row";

type TournamentFlatListProps = {
  matches: MatchSummary[];
  onOpenMatch: (matchId: string) => void;
  emptyState?: React.ReactNode;
  /**
   * When set and the list has more than `adSlotEvery` matches, the list is
   * chunked into cards of that size with an <AdSlotCard> rendered between
   * chunks. Omit (or set to 0) to preserve the single-card layout — Home
   * uses that path, Predicciones passes 6 to intersperse ads.
   */
  adSlotEvery?: number;
};

function MatchListCard({
  matches,
  onOpenMatch,
  locale
}: {
  matches: MatchSummary[];
  onOpenMatch: (matchId: string) => void;
  locale: "es" | "en";
}) {
  return (
    <Card elevated style={{ padding: 0, gap: 0 }}>
      <ul className="list-none p-0 m-0 grid">
        {matches.map((match, idx) => (
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

export function TournamentFlatList({
  matches,
  onOpenMatch,
  emptyState,
  adSlotEvery
}: TournamentFlatListProps) {
  const { locale } = useLocale();

  if (matches.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  if (!adSlotEvery || adSlotEvery <= 0 || matches.length <= adSlotEvery) {
    return <MatchListCard matches={matches} onOpenMatch={onOpenMatch} locale={locale} />;
  }

  const chunks: MatchSummary[][] = [];
  for (let i = 0; i < matches.length; i += adSlotEvery) {
    chunks.push(matches.slice(i, i + adSlotEvery));
  }

  const adDescription = copyForLocale(
    locale,
    "Espacio reservado para patrocinio nativo.",
    "Reserved slot for native sponsorship."
  );

  return (
    <div className="grid gap-3">
      {chunks.map((chunk, idx) => (
        <React.Fragment key={`chunk-${idx}`}>
          <MatchListCard matches={chunk} onOpenMatch={onOpenMatch} locale={locale} />
          {idx < chunks.length - 1 ? <AdSlotCard description={adDescription} /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
