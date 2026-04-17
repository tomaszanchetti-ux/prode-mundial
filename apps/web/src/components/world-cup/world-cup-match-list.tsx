"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toLocalKickoffLabel, toStageLabel } from "@/components/matches/matches-helpers";

type WorldCupMatchListProps = {
  matches: MatchSummary[];
  emptyCopy?: string;
};

function scoreLabel(match: MatchSummary): string | null {
  if (match.homeScore90 === null || match.awayScore90 === null) {
    return null;
  }
  return `${match.homeScore90} – ${match.awayScore90}`;
}

function statusToneLabel(match: MatchSummary): { label: string; className: string } | null {
  if (match.status === "live") {
    return { label: "EN VIVO", className: "text-accent-primary" };
  }
  if (match.status === "finished") {
    return { label: "FINALIZADO", className: "text-text-muted" };
  }
  return null;
}

export function WorldCupMatchList({ matches, emptyCopy }: WorldCupMatchListProps) {
  const { locale } = useLocale();

  if (matches.length === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
          {emptyCopy ?? "No hay partidos para mostrar en esta fase."}
        </p>
      </Card>
    );
  }

  return (
    <section className="grid gap-[10px]">
      {matches.map((match) => {
        const score = scoreLabel(match);
        const statusTag = statusToneLabel(match);

        return (
          <Card key={match.matchId} elevated style={{ padding: 12, gap: 8 }}>
            <div className="flex items-center justify-between gap-2">
              <span className="typo-small text-text-muted">
                {toStageLabel(match.stage, match.groupId, locale)}
              </span>
              <span className="text-[12px] text-text-muted">{toLocalKickoffLabel(match.kickoffAt, locale)}</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <TeamIdentity
                  team={{
                    teamName: match.homeTeam.name,
                    fifaCode: match.homeTeam.fifaCode,
                    flagAsset: match.homeTeam.flagAsset,
                    flagUrl: match.homeTeam.flagUrl
                  }}
                  size="md"
                  showFlag
                  showName
                  emphasis="compact"
                />
              </div>

              <span className="text-[18px] leading-[1] font-bold tabular-nums text-text-primary text-center min-w-[60px]">
                {score ?? "vs"}
              </span>

              <div className="flex items-center gap-2 min-w-0 justify-end">
                <TeamIdentity
                  team={{
                    teamName: match.awayTeam.name,
                    fifaCode: match.awayTeam.fifaCode,
                    flagAsset: match.awayTeam.flagAsset,
                    flagUrl: match.awayTeam.flagUrl
                  }}
                  size="md"
                  showFlag
                  showName
                  emphasis="compact"
                />
              </div>
            </div>

            {statusTag ? (
              <span className={`typo-small ${statusTag.className}`}>{statusTag.label}</span>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}
