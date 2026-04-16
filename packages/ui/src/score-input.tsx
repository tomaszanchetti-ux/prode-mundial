import React from "react";
import type { ScoreInputProps } from "./types";
import { normalizeScoreValue, stepScoreValue } from "./helpers";

function renderScoreInput(
  label: string,
  value: string,
  disabled: boolean | undefined,
  onChange: ((value: string) => void) | undefined
) {
  const safeValue = normalizeScoreValue(value);
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer";

  return (
    <div className="w-full min-h-[144px] rounded-lg border border-border-subtle score-panel-bg text-text-primary grid justify-items-center gap-3 py-3.5 px-3">
      <span className="typo-small text-text-muted text-center">{label}</span>
      <div
        aria-live="polite"
        className="w-[92px] h-[92px] rounded-[24px] score-display-bg grid place-items-center text-[42px] font-extrabold leading-none"
      >
        {safeValue === "" ? "0" : safeValue}
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bajar marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, -1))}
          className={`min-h-[42px] rounded-md score-btn text-text-primary text-[20px] font-bold ${disabledCls}`}
        >
          -
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Subir marcador de ${label}`}
          onClick={() => onChange?.(stepScoreValue(safeValue, 1))}
          className={`min-h-[42px] rounded-md score-btn text-text-primary text-[20px] font-bold ${disabledCls}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ScoreInput({
  awayLabel = "Visitante",
  awayValue,
  classifierLabel = "Quien clasifica",
  classifierOptions = [],
  classifierValue = "",
  disabled,
  error,
  homeLabel = "Local",
  homeValue,
  onAwayChange,
  onClassifierChange,
  onHomeChange
}: ScoreInputProps) {
  const showClassifier = classifierOptions.length > 0;
  const disabledCls = disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer";

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        {renderScoreInput(homeLabel, homeValue, disabled, onHomeChange)}
        <div
          aria-hidden="true"
          className="w-9 h-9 rounded-pill grid place-items-center text-text-muted bg-bg-inset border border-border-subtle"
        >
          -
        </div>
        {renderScoreInput(awayLabel, awayValue, disabled, onAwayChange)}
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
