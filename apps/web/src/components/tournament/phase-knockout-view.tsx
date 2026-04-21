"use client";

import React from "react";
import type { MatchSummary } from "@prode/shared";
import { Card } from "@prode/ui";
import { TournamentMatchList } from "./tournament-match-list";

type PhaseKnockoutViewProps = {
  matches: MatchSummary[];
  phaseLabel: string;
  onOpenMatch: (matchId: string) => void;
};

export function PhaseKnockoutView({ matches, phaseLabel, onOpenMatch }: PhaseKnockoutViewProps) {
  if (matches.length === 0) {
    return (
      <Card elevated style={{ gap: 8, textAlign: "center", justifyItems: "center", padding: 24 }}>
        <span className="typo-small text-text-muted">FASE BLOQUEADA</span>
        <h2 className="typo-h2 m-0 text-text-primary">{phaseLabel} todavia no esta disponible.</h2>
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary max-w-[420px]">
          Los cruces se resuelven cuando termina la fase anterior.
        </p>
      </Card>
    );
  }

  return <TournamentMatchList matches={matches} onOpenMatch={onOpenMatch} />;
}
