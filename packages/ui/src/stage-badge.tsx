import React from "react";

export type TournamentStage = "group" | "R32" | "R16" | "QF" | "SF" | "BRONZE" | "FINAL";

export type StageBadgeProps = {
  stage: TournamentStage;
  groupId?: string | null;
  label?: string;
  size?: "sm" | "md";
};

const stageConfig: Record<TournamentStage, { icon: string; accent: string; defaultLabel: string }> = {
  group: { icon: "⬡", accent: "stage-badge-group", defaultLabel: "Fase de grupos" },
  R32: { icon: "⚔", accent: "stage-badge-knockout", defaultLabel: "32avos" },
  R16: { icon: "⚔", accent: "stage-badge-knockout", defaultLabel: "Octavos" },
  QF: { icon: "◆", accent: "stage-badge-knockout", defaultLabel: "Cuartos" },
  SF: { icon: "★", accent: "stage-badge-semi", defaultLabel: "Semifinal" },
  BRONZE: { icon: "🥉", accent: "stage-badge-bronze", defaultLabel: "Tercer puesto" },
  FINAL: { icon: "🏆", accent: "stage-badge-final", defaultLabel: "Final" }
};

export function StageBadge({ stage, groupId, label, size = "md" }: StageBadgeProps) {
  const config = stageConfig[stage];
  const displayLabel = label ?? (stage === "group" && groupId ? `Grupo ${groupId}` : config.defaultLabel);
  const sizeClass = size === "sm" ? "stage-badge-sm" : "stage-badge-md";

  return (
    <span className={`stage-badge ${config.accent} ${sizeClass}`}>
      <span className="stage-badge-icon" aria-hidden="true">{config.icon}</span>
      {displayLabel}
    </span>
  );
}
