"use client";

import React from "react";
import type { MacroGroupId, SaveMacroPicksInput } from "@prode/shared";
import { Card } from "@prode/ui";
import { MACRO_ALL_TEAMS, MACRO_GROUPS } from "./macro-picks-data";
import { GroupPickerCard } from "./macro-picks-cards";

type MacroPicksEditorProps = {
  formState: SaveMacroPicksInput;
  isSaving: boolean;
  onChangeGroupPick: (groupId: MacroGroupId, slot: "firstTeamId" | "secondTeamId", value: string) => void;
  onChangeFinalist: (index: 0 | 1, value: string) => void;
  onChangeChampion: (value: string) => void;
};

export function MacroPicksEditor({
  formState,
  isSaving,
  onChangeGroupPick,
  onChangeFinalist,
  onChangeChampion
}: MacroPicksEditorProps) {
  return (
    <>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {MACRO_GROUPS.map((group) => {
          const currentPick = formState.groupPicks[group.groupId];

          return (
            <GroupPickerCard
              key={group.groupId}
              groupId={group.groupId}
              groupLabel={group.label}
              firstTeamId={currentPick?.firstTeamId ?? ""}
              secondTeamId={currentPick?.secondTeamId ?? ""}
              disabled={isSaving}
              onChange={(slot, value) => onChangeGroupPick(group.groupId, slot, value)}
            />
          );
        })}
      </div>

      <Card elevated style={{ gap: 16, padding: 16 }}>
        <div className="grid gap-1">
          <span className="typo-small text-gold">TRAMO FINAL</span>
          <strong className="text-[18px] leading-[1.2] text-text-primary">Finalistas y campeon</strong>
        </div>

        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {[0, 1].map((index) => (
            <label key={index} className="grid gap-2">
              <span className="typo-small text-text-secondary">Finalista {index + 1}</span>
              <select
                aria-label={`Finalista ${index + 1}`}
                disabled={isSaving}
                value={formState.finalists[index] ?? ""}
                onChange={(event) => onChangeFinalist(index as 0 | 1, event.target.value)}
                className="select-input"
              >
                <option value="">Selecciona equipo</option>
                {MACRO_ALL_TEAMS.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="grid gap-2">
            <span className="typo-small text-text-secondary">Campeon</span>
            <select
              aria-label="Campeon"
              disabled={isSaving}
              value={formState.champion ?? ""}
              onChange={(event) => onChangeChampion(event.target.value)}
              className="select-input"
            >
              <option value="">Selecciona equipo</option>
              {MACRO_ALL_TEAMS.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
    </>
  );
}
