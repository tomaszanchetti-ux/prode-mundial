import React from "react";
import type { PredictionModalProps } from "./types";
import { Button } from "./button";
import { TeamIdentityRow } from "./team";

export function PredictionModal({
  awayTeam,
  children,
  helperText,
  homeTeam,
  isOpen,
  kickoffLabel,
  onClose,
  onSubmit,
  saveLabel = "Guardar prediccion",
  saving = false,
  stageLabel,
  title = "Tu proximo partido"
}: PredictionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 p-3 modal-overlay flex items-end justify-center z-50"
    >
      <div className="w-full max-w-[560px] card-base grid gap-4.5 p-4.5 shadow-modal rounded-t-xl rounded-b-lg modal-content-bg">
        <div className="flex justify-between items-start gap-3">
          <div className="grid gap-2">
            <span className="typo-eyebrow">{stageLabel}</span>
            <h2 className="typo-h2 m-0 text-text-primary">{title}</h2>
            <p className="m-0 text-[14px] leading-[1.4] text-text-secondary">{kickoffLabel}</p>
          </div>
          {onClose ? (
            <button type="button" aria-label="Cerrar" onClick={onClose} className="close-btn">
              X
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 p-4.5 rounded-lg matchup-panel-bg">
          <TeamIdentityRow {...homeTeam} align="center" size="lg" weight={700} />
          <div className="text-center text-text-muted text-[12px] font-bold tracking-[0.08em]">VS</div>
          <TeamIdentityRow {...awayTeam} align="center" size="lg" weight={700} />
        </div>

        {helperText ? (
          <div className="grid gap-[6px] py-3 px-3.5 rounded-md bg-bg-inset border border-border-subtle">
            <p className="typo-body m-0 text-text-secondary">{helperText}</p>
          </div>
        ) : null}

        {children}

        <div className="grid gap-2">
          <Button fullWidth onClick={onSubmit} loading={saving}>
            {saveLabel}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Mas tarde
          </Button>
        </div>
      </div>
    </div>
  );
}
