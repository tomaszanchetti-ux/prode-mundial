"use client";

import React from "react";
import type { ConfirmMacroAdjustmentInput } from "@prode/shared";
import { Card } from "@prode/ui";
import { MACRO_ALL_TEAMS } from "./macro-picks-data";

type MacroPicksAdjustmentProps = {
  adjustmentState: ConfirmMacroAdjustmentInput;
  adjustmentValidationMessages: string[];
  isConfirmingAdjustment: boolean;
  onChangeAdjustmentFinalist: (index: 0 | 1, value: string) => void;
  onChangeAdjustmentChampion: (value: string) => void;
};

export function MacroPicksAdjustment({
  adjustmentState,
  adjustmentValidationMessages,
  isConfirmingAdjustment,
  onChangeAdjustmentFinalist,
  onChangeAdjustmentChampion
}: MacroPicksAdjustmentProps) {
  const hasAdjustmentValidationErrors = adjustmentValidationMessages.length > 0;

  return (
    <Card elevated style={{ gap: 16, padding: 16 }}>
      <div className="grid gap-1.5">
        <span className="typo-small text-primary-500">AJUSTE POST GRUPOS</span>
        <strong className="text-[18px] leading-[1.2] text-text-primary">Ahora solo puedes tocar finalistas y campeon</strong>
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
          Este ajuste es unico e irreversible. Los grupos ya no se modifican y el modelo aplica penalizacion reducida en los aciertos finales.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {[0, 1].map((index) => (
          <label key={index} className="grid gap-2">
            <span className="typo-small text-text-secondary">Nuevo finalista {index + 1}</span>
            <select
              aria-label={`Nuevo finalista ${index + 1}`}
              disabled={isConfirmingAdjustment}
              value={adjustmentState.finalists[index] ?? ""}
              onChange={(event) => onChangeAdjustmentFinalist(index as 0 | 1, event.target.value)}
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
          <span className="typo-small text-text-secondary">Nuevo campeon</span>
          <select
            aria-label="Nuevo campeon"
            disabled={isConfirmingAdjustment}
            value={adjustmentState.champion}
            onChange={(event) => onChangeAdjustmentChampion(event.target.value)}
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

      {hasAdjustmentValidationErrors ? (
        <div className="grid gap-1.5 p-3 rounded-md alert-warning">
          {adjustmentValidationMessages.map((message) => (
            <p key={message} className="m-0 text-[14px] leading-[1.45]">
              {message}
            </p>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
          Cuando lo confirmes, esta version queda congelada y reemplaza solo el tramo final del pick original.
        </p>
      )}
    </Card>
  );
}
