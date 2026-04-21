"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ScoreInputProps, TeamData } from "./types";
import { normalizeScoreValue, stepScoreValue } from "./helpers";

function ScoreStepper({
  label,
  team,
  value,
  disabled,
  onChange
}: {
  label: string;
  team?: TeamData;
  value: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const safeValue = normalizeScoreValue(value);
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "";
  const [bumping, setBumping] = useState(false);
  const prevValue = useRef(safeValue);

  useEffect(() => {
    if (safeValue !== prevValue.current) {
      prevValue.current = safeValue;
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 180);
      return () => clearTimeout(t);
    }
  }, [safeValue]);

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Score display */}
      <div
        aria-live="polite"
        className="w-[88px] h-[88px] rounded-[22px] score-display-bg grid place-items-center text-[44px] font-extrabold leading-none select-none"
        style={bumping ? { animation: "score-bump 180ms ease-out" } : undefined}
      >
        {safeValue === "" ? "0" : safeValue}
      </div>

      {/* +/- buttons */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bajar marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, -1))}
          className={`min-h-[48px] rounded-[var(--radius-md)] score-btn text-[22px] font-bold active:scale-95 transition-transform ${disabledCls}`}
        >
          −
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Subir marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, 1))}
          className={`min-h-[48px] rounded-[var(--radius-md)] score-btn text-[22px] font-bold active:scale-95 transition-transform ${disabledCls}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ScoreInput({
  awayLabel = "Visitante",
  awayTeam,
  awayValue,
  classifierLabel = "Quien clasifica",
  classifierOptions = [],
  classifierValue = "",
  disabled,
  error,
  homeLabel = "Local",
  homeTeam,
  homeValue,
  onAwayChange,
  onClassifierChange,
  onHomeChange
}: ScoreInputProps) {
  const showClassifier = classifierOptions.length > 0;
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer";

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <ScoreStepper label={homeLabel} team={homeTeam} value={homeValue} disabled={disabled} onChange={onHomeChange} />
        <span aria-hidden="true" className="text-[13px] font-bold tracking-[0.1em] text-text-muted mt-[38px]">
          –
        </span>
        <ScoreStepper label={awayLabel} team={awayTeam} value={awayValue} disabled={disabled} onChange={onAwayChange} />
      </div>

      {showClassifier ? (
        <div className="grid gap-2">
          <span className="typo-small text-text-secondary">{classifierLabel}</span>
          <div className="grid gap-2">
            {classifierOptions.map((option) => {
              const isActive = option.value === classifierValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  className={`classifier-option ${isActive ? "classifier-active" : "classifier-inactive"} ${disabledCls}`}
                  onClick={() => onClassifierChange?.(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="m-0 text-[13px] leading-[1.4] text-error">{error}</p> : null}
    </div>
  );
}
