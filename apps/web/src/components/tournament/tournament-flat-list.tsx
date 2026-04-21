"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { Card } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MatchRow } from "@/components/matches/match-row";

type TournamentFlatListProps = {
  matches: MatchSummary[];
  onOpenMatch: (matchId: string) => void;
  emptyState?: React.ReactNode;
};

export function TournamentFlatList({ matches, onOpenMatch, emptyState }: TournamentFlatListProps) {
  const { locale } = useLocale();

  if (matches.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

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
