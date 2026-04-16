import React from "react";
import type { PredictionModalProps } from "./types";
import { Button } from "./button";
import { TeamIdentity } from "./team";

export function PredictionModal({
  awayTeam,
  children,
  closeLabel = "Mas tarde",
  helperText,
  homeTeam,
  isOpen,
  kickoffLabel,
  onClose,
  onSubmit,
  progressCurrent,
  progressTotal,
  saveLabel = "Guardar prediccion",
  saving = false,
  stageLabel,
  title
}: PredictionModalProps) {
  if (!isOpen) return null;

  const showProgress = progressCurrent != null && progressTotal != null && progressTotal > 0;
  const progressPct = showProgress ? Math.round((progressCurrent / progressTotal) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 modal-overlay flex items-end justify-center z-50"
    >
      <div className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto card-base grid gap-4 shadow-modal rounded-t-xl modal-content-bg modal-sheet-enter">
        {/* ── Header: close + progress ── */}
        <div className="sticky top-0 z-10 modal-content-bg px-5 pt-4 pb-0 grid gap-3">
          <div className="flex justify-between items-center">
            <span className="typo-eyebrow text-text-muted uppercase">{stageLabel}</span>
            {onClose ? (
              <button type="button" aria-label="Cerrar" onClick={onClose} className="close-btn">
                X
              </button>
            ) : null}
          </div>

          {showProgress ? (
            <div className="grid gap-1.5">
              <div className="h-1 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%`, background: "var(--color-primary-500)" }}
                />
              </div>
              <span className="typo-eyebrow text-text-muted text-right">
                {progressCurrent} / {progressTotal}
              </span>
            </div>
          ) : null}
        </div>

        {/* ── Matchup (centered duel) ── */}
        <div className="px-5">
          <div className="flex items-center justify-center gap-5 py-3">
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <TeamIdentity team={homeTeam} size="lg" emphasis="hero" align="center" />
            </div>
            <span className="text-[13px] font-bold tracking-[0.1em] text-text-muted shrink-0">VS</span>
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <TeamIdentity team={awayTeam} size="lg" emphasis="hero" align="center" />
            </div>
          </div>
          <p className="m-0 typo-small text-text-muted text-center">{kickoffLabel}</p>
        </div>

        {helperText ? (
          <div className="mx-5 py-2.5 px-3.5 rounded-md bg-bg-inset border border-border-subtle">
            <p className="typo-body m-0 text-text-secondary text-center">{helperText}</p>
          </div>
        ) : null}

        {/* ── Score picker (children) ── */}
        <div className="px-5">{children}</div>

        {/* ── CTAs ── */}
        <div className="grid gap-2 px-5 pb-5">
          <Button fullWidth onClick={onSubmit} loading={saving}>
            {saveLabel}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
