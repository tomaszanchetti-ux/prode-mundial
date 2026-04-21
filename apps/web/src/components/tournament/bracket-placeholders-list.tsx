"use client";

import React from "react";
import type { TournamentProjectionBracket, TournamentProjectionMatch } from "@prode/shared";
import { Card } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toKickoffLabel } from "@/components/home/home-helpers";

type BracketPlaceholdersListProps = {
  bracket: TournamentProjectionBracket;
};

function flattenBracket(bracket: TournamentProjectionBracket): TournamentProjectionMatch[] {
  return [
    ...bracket.round32,
    ...bracket.round16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...bracket.bronze,
    ...bracket.final
  ].sort((a, b) => {
    const diff = new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
    if (diff !== 0) return diff;
    return a.matchId.localeCompare(b.matchId);
  });
}

function slotText(side: TournamentProjectionMatch["home"]): string {
  return side.team?.name ?? side.slotLabel ?? side.slot;
}

export function BracketPlaceholdersList({ bracket }: BracketPlaceholdersListProps) {
  const { locale } = useLocale();
  const rows = flattenBracket(bracket);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card elevated style={{ padding: 0, gap: 0 }}>
      <ul className="list-none p-0 m-0 grid">
        {rows.map((match, idx) => {
          const kickoff = toKickoffLabel(match.kickoffAt, locale);
          const homeText = slotText(match.home);
          const awayText = slotText(match.away);

          return (
            <li
              key={match.matchId}
              className={`grid gap-1 px-4 py-3 ${idx > 0 ? "border-t border-border-subtle" : ""}`}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <span className="text-[14px] leading-[1.2] text-text-secondary font-medium truncate text-right">
                  {homeText}
                </span>
                <span className="text-text-muted font-bold text-[13px]">vs</span>
                <span className="text-[14px] leading-[1.2] text-text-secondary font-medium truncate text-left">
                  {awayText}
                </span>
              </div>
              <span className="typo-meta text-center">{kickoff}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
