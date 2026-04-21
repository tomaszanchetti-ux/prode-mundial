"use client";

import React from "react";
import type { TuMundialGroupCard } from "@prode/shared";
import { Card } from "@prode/ui";
import { GroupStandingsCard } from "./group-standings-card";

type ResultsGroupsViewProps = {
  groups: TuMundialGroupCard[];
};

export function ResultsGroupsView({ groups }: ResultsGroupsViewProps) {
  if (groups.length === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <span className="typo-small text-text-muted">SIN GRUPOS</span>
        <h2 className="typo-h2 m-0 text-text-primary">Todavia no hay datos de grupos.</h2>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <GroupStandingsCard key={group.groupId} group={group} />
      ))}
    </div>
  );
}
