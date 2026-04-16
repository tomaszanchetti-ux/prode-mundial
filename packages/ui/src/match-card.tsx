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
    <Card elevated style={{ gap: 10, padding: 12 }}>
      <div className="flex justify-between items-center gap-2.5 flex-wrap">
        <div className="grid gap-[6px]">
          {stage && KNOWN_STAGES.has(stage) ? (
            <StageBadge stage={stage as TournamentStage} groupId={groupId} label={stageLabel} size="sm" />
          ) : (
            <span className="typo-eyebrow">{stageLabel}</span>
          )}
          <span className="text-[13px] leading-[1.35] text-text-secondary">{kickoffLabel}</span>
        </div>
        <StatusTag status={status} label={statusLabel} />
      </div>

      <div className="grid gap-2">
        <TeamIdentity team={homeTeam} size="md" emphasis="hero" />
        <TeamIdentity team={awayTeam} size="md" emphasis="hero" />
      </div>

      <div className="flex justify-between items-start gap-2.5 py-2.5 px-3 rounded-md prediction-row-bg flex-wrap">
        <p className="typo-body m-0 text-text-primary font-semibold flex-[1_1_220px]">
          {predictionSummary ?? "Aun no predijiste este partido"}
        </p>
        {resultSummary ? (
          <p className="m-0 text-[13px] leading-[1.35] text-text-secondary flex-[1_1_220px] text-left">
            {resultSummary}
          </p>
        ) : null}
      </div>

      <Button variant={isActionable ? "primary" : "secondary"} fullWidth onClick={onAction} style={{ minHeight: 44 }}>
        {ctaLabel}
      </Button>
    </Card>
  );
}
