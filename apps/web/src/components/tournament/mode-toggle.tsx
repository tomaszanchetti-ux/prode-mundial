"use client";

import React from "react";

export type TournamentMode = "predictions" | "results";

type ModeToggleProps = {
  activeMode: TournamentMode;
  onSelect: (mode: TournamentMode) => void;
};

const OPTIONS: Array<{ mode: TournamentMode; label: string }> = [
  { mode: "predictions", label: "Mis Predicciones" },
  { mode: "results", label: "Mis Resultados" }
];

export function ModeToggle({ activeMode, onSelect }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="Modo Tu Mundial">
      {OPTIONS.map((option) => {
        const isActive = option.mode === activeMode;

        return (
          <button
            key={option.mode}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(option.mode)}
            className={`mode-toggle-option ${isActive ? "mode-toggle-option--active" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
