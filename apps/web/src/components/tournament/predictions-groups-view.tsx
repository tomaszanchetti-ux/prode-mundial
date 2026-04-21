"use client";

import React, { useMemo, useState } from "react";
import type { MatchSummary, TuMundialGroupCard } from "@prode/shared";
import { Card, StatusTag } from "@prode/ui";
import { TournamentMatchList } from "./tournament-match-list";

type PredictionsGroupsViewProps = {
  groups: TuMundialGroupCard[];
  matchesByGroupId: Map<string, MatchSummary[]>;
  onOpenMatch: (matchId: string) => void;
};

function countPendingInGroup(matches: MatchSummary[]) {
  return matches.filter((m) => m.predictionStatus === "empty" && m.isEditable).length;
}

function countSavedInGroup(matches: MatchSummary[]) {
  return matches.filter((m) => m.predictionStatus === "saved_editable").length;
}

function resolveGroupTone(matches: MatchSummary[]) {
  if (matches.length === 0) {
    return { tone: "neutral" as const, label: "Sin partidos" };
  }

  const allScoredOrLocked = matches.every(
    (m) => m.predictionStatus === "scored" || m.predictionStatus === "locked_unscored"
  );

  if (allScoredOrLocked) {
    return { tone: "scored" as const, label: "Cerrado" };
  }

  const pendingCount = countPendingInGroup(matches);

  if (pendingCount === 0) {
    return { tone: "saved" as const, label: "Todo listo" };
  }

  return { tone: "editable" as const, label: `${pendingCount} pendientes` };
}

export function PredictionsGroupsView({ groups, matchesByGroupId, onOpenMatch }: PredictionsGroupsViewProps) {
  const firstExpandable = useMemo(() => {
    for (const group of groups) {
      const groupMatches = matchesByGroupId.get(group.groupId) ?? [];

      if (countPendingInGroup(groupMatches) > 0) {
        return group.groupId;
      }
    }

    return groups[0]?.groupId ?? null;
  }, [groups, matchesByGroupId]);

  const [expandedId, setExpandedId] = useState<string | null>(firstExpandable);

  if (groups.length === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <span className="typo-small text-text-muted">SIN GRUPOS</span>
        <h2 className="typo-h2 m-0 text-text-primary">Todavia no hay grupos cargados.</h2>
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {groups.map((group) => {
        const groupMatches = matchesByGroupId.get(group.groupId) ?? [];
        const isExpanded = expandedId === group.groupId;
        const tone = resolveGroupTone(groupMatches);
        const savedCount = countSavedInGroup(groupMatches);
        const totalMatches = groupMatches.length;

        return (
          <Card key={group.groupId} elevated style={{ padding: 0, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : group.groupId)}
              aria-expanded={isExpanded}
              className="group-accordion-header"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="group-accordion-chevron" aria-hidden>
                  {isExpanded ? "▾" : "▸"}
                </span>
                <span className="typo-small text-text-muted">{group.groupName}</span>
                <span className="text-[12px] leading-[1.3] text-text-muted">
                  {savedCount}/{totalMatches} guardados
                </span>
              </div>
              <StatusTag status={tone.tone} label={tone.label} />
            </button>

            {isExpanded && groupMatches.length > 0 ? (
              <div className="px-3 pb-3 pt-1">
                <TournamentMatchList matches={groupMatches} onOpenMatch={onOpenMatch} />
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
