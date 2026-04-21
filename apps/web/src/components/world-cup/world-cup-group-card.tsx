"use client";

import React from "react";
import type { FullGroupStandings } from "@prode/shared";
import { resolveTeamIdentity } from "@prode/shared";
import { Card, StatusTag, TeamIdentity } from "@prode/ui";

type WorldCupGroupCardProps = {
  group: FullGroupStandings;
  groupName: string;
  playedMatches: number;
  totalMatches: number;
};

function toGroupState(playedMatches: number, totalMatches: number) {
  if (playedMatches === 0) {
    return { label: "Por comenzar", tone: "neutral" as const };
  }
  if (playedMatches === totalMatches) {
    return { label: "Cerrado", tone: "scored" as const };
  }
  return { label: "En juego", tone: "editable" as const };
}

export function WorldCupGroupCard({ group, groupName, playedMatches, totalMatches }: WorldCupGroupCardProps) {
  const state = toGroupState(playedMatches, totalMatches);

  return (
    <Card elevated style={{ gap: 10, padding: 14 }}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="typo-small text-text-muted">{groupName}</span>
          <span className="text-[12px] leading-[1.3] text-text-muted">
            {playedMatches}/{totalMatches}
          </span>
        </div>
        <StatusTag status={state.tone} label={state.label} />
      </div>

      <div className="grid gap-[6px]">
        <div className="grid grid-cols-[minmax(0,1fr)_36px_36px_36px] gap-1.5 items-center px-2">
          <span className="text-[11px] font-semibold text-text-muted tracking-wide">EQUIPO</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">PJ</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">DG</span>
          <span className="text-[11px] font-semibold text-text-muted text-center">PTS</span>
        </div>

        {group.rows.map((row) => {
          const qualified = row.position <= 2;
          const identity = resolveTeamIdentity(row.teamId);

          return (
            <div
              key={row.teamId}
              className={`grid grid-cols-[minmax(0,1fr)_36px_36px_36px] gap-1.5 items-center px-2 py-2 rounded-[10px] ${
                qualified ? "group-row-qualified" : "bg-bg-surface border border-border-default"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[11px] leading-[1] font-bold w-[18px] text-center ${
                    qualified ? "text-primary-600" : "text-text-muted"
                  }`}
                >
                  {row.position}
                </span>
                <TeamIdentity
                  team={{
                    teamName: row.teamName,
                    fifaCode: identity.fifaCode,
                    flagAsset: identity.flagAsset,
                    flagUrl: identity.flagUrl
                  }}
                  size="sm"
                  emphasis="compact"
                />
              </div>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center">{row.played}</span>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center">{row.goalDifference}</span>
              <span className="text-[13px] leading-[1.2] text-text-primary text-center font-bold">{row.points}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
