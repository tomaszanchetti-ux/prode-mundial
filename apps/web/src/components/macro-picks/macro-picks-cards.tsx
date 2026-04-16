"use client";

import React from "react";
import type { MacroGroupId } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";
import { MACRO_GROUPS, MACRO_TEAM_BY_ID } from "./macro-picks-data";

export function renderTeamSummary(teamId: string | null | undefined, fallback = "Sin definir") {
  const team = teamId ? MACRO_TEAM_BY_ID.get(teamId) ?? null : null;

  if (!team) {
    return <span className="text-[14px] leading-[1.4] text-text-secondary">{fallback}</span>;
  }

  return (
    <TeamIdentity team={team} size="sm" emphasis="default" />
  );
}

type GroupPickerCardProps = {
  groupId: MacroGroupId;
  groupLabel: string;
  firstTeamId: string;
  secondTeamId: string;
  disabled: boolean;
  onChange: (slot: "firstTeamId" | "secondTeamId", value: string) => void;
};

export function GroupPickerCard({
  groupId,
  groupLabel,
  firstTeamId,
  secondTeamId,
  disabled,
  onChange
}: GroupPickerCardProps) {
  const group = MACRO_GROUPS.find((item) => item.groupId === groupId);

  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="grid gap-1">
        <span className="typo-small text-text-muted">{groupLabel.toUpperCase()}</span>
        <strong className="text-[18px] leading-[1.2] text-text-primary">Tus clasificados</strong>
      </div>

      <label className="grid gap-2">
        <span className="typo-small text-text-secondary">1° del grupo</span>
        <select
          aria-label={`${groupLabel} primero`}
          disabled={disabled}
          value={firstTeamId}
          onChange={(event) => onChange("firstTeamId", event.target.value)}
          className="select-input"
        >
          <option value="">Selecciona equipo</option>
          {group?.teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="typo-small text-text-secondary">2° del grupo</span>
        <select
          aria-label={`${groupLabel} segundo`}
          disabled={disabled}
          value={secondTeamId}
          onChange={(event) => onChange("secondTeamId", event.target.value)}
          className="select-input"
        >
          <option value="">Selecciona equipo</option>
          {group?.teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}

type MacroSummaryCardProps = {
  title: string;
  subtitle: string;
  finalists: string[];
  champion: string | null;
};

export function MacroSummaryCard({ title, subtitle, finalists, champion }: MacroSummaryCardProps) {
  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="grid gap-1">
        <span className="typo-small text-text-muted">{title.toUpperCase()}</span>
        <strong className="text-[18px] leading-[1.2] text-text-primary">{subtitle}</strong>
      </div>
      <div className="grid gap-2">
        <div className="grid gap-1.5 p-3 surface-inset">
          <span className="typo-small text-text-muted">FINALISTA 1</span>
          {renderTeamSummary(finalists[0] ?? null)}
        </div>
        <div className="grid gap-1.5 p-3 surface-inset">
          <span className="typo-small text-text-muted">FINALISTA 2</span>
          {renderTeamSummary(finalists[1] ?? null)}
        </div>
        <div className="grid gap-1.5 p-3 surface-inset">
          <span className="typo-small text-text-muted">CAMPEON</span>
          {renderTeamSummary(champion)}
        </div>
      </div>
    </Card>
  );
}
