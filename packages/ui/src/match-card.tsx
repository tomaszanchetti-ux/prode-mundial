import React from "react";
import type { MatchCardProps } from "./types";
import { Button } from "./button";
import { Card } from "./card";
import { StageBadge, type TournamentStage } from "./stage-badge";
import { StatusTag } from "./status-tag";
import { TeamIdentity } from "./team";

const KNOWN_STAGES = new Set(["group", "R32", "R16", "QF", "SF", "BRONZE", "FINAL"]);

export function MatchCard({
  awayTeam,
  ctaLabel,
  groupId,
  homeTeam,
  kickoffLabel,
  onAction,
  predictionSummary,
  resultSummary,
  stage,
  stageLabel,
  status,
  statusLabel
}: MatchCardProps) {
  const isActionable = status === "editable" || status === "live";

  return (
    <Card elevated style={{ gap: 8, padding: 10 }}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          {stage && KNOWN_STAGES.has(stage) ? (
            <StageBadge stage={stage as TournamentStage} groupId={groupId} label={stageLabel} size="sm" />
          ) : (
            <span className="typo-eyebrow">{stageLabel}</span>
          )}
          <span className="text-[12px] leading-[1.3] text-text-muted">{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div className="flex items-center gap-3 py-1">
        <TeamIdentity team={homeTeam} size="sm" emphasis="default" />
        <span className="text-[11px] font-bold text-text-muted tracking-wide">VS</span>
        <TeamIdentity team={awayTeam} size="sm" emphasis="default" />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[13px] leading-[1.3] text-text-secondary">
          {predictionSummary ?? "Sin predicción"}
        </span>
        {isActionable ? (
          <Button variant="primary" onClick={onAction} style={{ minHeight: 36, fontSize: 13, padding: "0 14px" }}>
            {ctaLabel}
          </Button>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="text-[12px] leading-[1.3] font-semibold text-text-muted px-2.5 py-1 rounded-md bg-bg-muted border border-border-default"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </Card>
  );
}
