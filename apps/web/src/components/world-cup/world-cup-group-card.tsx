"use client";

import React from "react";
import type { FullGroupStandings } from "@prode/shared";
import { resolveTeamIdentity } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";

type WorldCupGroupCardProps = {
  group: FullGroupStandings;
  groupName: string;
};

export function WorldCupGroupCard({ group, groupName }: WorldCupGroupCardProps) {
  return (
    <Card elevated style={{ gap: 8, padding: 12 }}>
      <span className="typo-eyebrow text-primary-600">{groupName}</span>

      <div className="grid gap-[4px]">
        {group.rows.map((row) => {
          const qualified = row.position <= 2;
          const identity = resolveTeamIdentity(row.teamId);

          return (
            <div
              key={row.teamId}
              className={`grid grid-cols-[24px_minmax(0,1fr)_32px] gap-2 items-center px-2 py-1.5 rounded-[8px] ${
                qualified ? "group-row-qualified" : "bg-bg-surface border border-border-default"
              }`}
            >
              <span
                className={`text-[12px] leading-[1] font-bold text-center ${
                  qualified ? "text-success" : "text-text-muted"
                }`}
              >
                {row.position}
              </span>
              <div className="flex items-center gap-2 min-w-0">
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
              <span className="text-[14px] leading-[1.2] text-text-primary text-center font-bold tabular-nums">
                {row.points}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
