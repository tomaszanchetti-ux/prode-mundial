"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { AdSlotCard, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { MatchResultRow } from "@/components/matches/match-result-row";

type WorldCupMatchesListProps = {
  matches: MatchSummary[];
  emptyState?: React.ReactNode;
  adSlotEvery?: number;
};

function MatchResultsCard({
  matches,
  locale
}: {
  matches: MatchSummary[];
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
            <MatchResultRow match={match} locale={locale} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function WorldCupMatchesList({
  matches,
  emptyState,
  adSlotEvery
}: WorldCupMatchesListProps) {
  const { locale } = useLocale();

  if (matches.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  if (!adSlotEvery || adSlotEvery <= 0 || matches.length <= adSlotEvery) {
    return <MatchResultsCard matches={matches} locale={locale} />;
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
          <MatchResultsCard matches={chunk} locale={locale} />
          {idx < chunks.length - 1 ? <AdSlotCard description={adDescription} /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
