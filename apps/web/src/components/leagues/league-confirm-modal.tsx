"use client";

import React from "react";
import { Button } from "@prode/ui";

export type LeagueConfirmAction = "leave" | "delete";

type Props = {
  isOpen: boolean;
  action: LeagueConfirmAction;
  leagueName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const COPY: Record<LeagueConfirmAction, { title: string; body: string; confirmLabel: string; submittingLabel: string }> = {
  leave: {
    title: "Abandonar liga",
    body: "Si abandonás esta liga vas a salir del ranking. Podés volver a entrar más adelante con el código de invitación.",
    confirmLabel: "Sí, abandonar",
    submittingLabel: "Abandonando..."
  },
  delete: {
    title: "Eliminar liga",
    body: "Vas a eliminar la liga para todos los miembros. Se borran las posiciones y los miembros pierden acceso. Esta acción no se puede deshacer.",
    confirmLabel: "Sí, eliminar",
    submittingLabel: "Eliminando..."
  }
};

export function LeagueConfirmModal({ isOpen, action, leagueName, isSubmitting, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  const copy = COPY[action];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="league-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={isSubmitting ? undefined : onCancel}
    >
      <div
        className="w-full max-w-[400px] grid gap-4 p-5 rounded-[var(--radius-lg)] modal-content-bg modal-sheet-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-1.5">
          <h2 id="league-confirm-title" className="typo-h3 m-0 text-text-primary">
            {copy.title}
          </h2>
          <p className="typo-body m-0 text-text-secondary">
            <strong className="text-text-primary">{leagueName}</strong>
          </p>
          <p className="typo-body m-0 text-text-secondary">{copy.body}</p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-md)] px-4 py-3 typo-body font-bold text-white bg-[var(--color-error,#DC2626)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? copy.submittingLabel : copy.confirmLabel}
          </button>
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
