"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { PERMISSION_DISMISSED_EVENT } from "@/lib/permissions/permission-events";
import {
  markDoubleModalShown,
  shouldShowDoubleModal
} from "@/lib/permissions/double-dismiss-tracker";

/*
 * EPIC 32 WS6 / 6d — Modal one-time post double-dismiss.
 *
 * Aparece cuando el user dismissio AMBAS cards (notif + install) y nunca
 * antes vio este modal. Solo informa que puede activar desde el Perfil.
 *
 * Mount: setea listener al PERMISSION_DISMISSED_EVENT que dispara cada
 * tracker al markXxxDismissed. Reevalua condicion en cada evento.
 */
export function DoubleDismissModal() {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function evaluate() {
      if (shouldShowDoubleModal()) {
        setIsOpen(true);
      }
    }

    // Eval initial — por si el user ya estaba en double-dismiss al mount.
    evaluate();

    if (typeof window === "undefined") return;
    window.addEventListener(PERMISSION_DISMISSED_EVENT, evaluate);
    return () => window.removeEventListener(PERMISSION_DISMISSED_EVENT, evaluate);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    markDoubleModalShown();
    setIsOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="double-dismiss-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[360px] grid gap-4 p-5 rounded-[var(--radius-lg)] modal-content-bg modal-sheet-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-1">
          <h2 id="double-dismiss-title" className="typo-h3 m-0 text-text-primary">
            {copyForLocale(locale, "Sin problema", "No worries")}
          </h2>
          <p className="typo-body m-0 text-text-secondary">
            {copyForLocale(
              locale,
              "Siempre podrás activar notificaciones o instalar la app desde Tu Perfil.",
              "You can always enable notifications or install the app from your Profile."
            )}
          </p>
        </div>

        <Button onClick={handleClose}>
          {copyForLocale(locale, "Entendido", "Got it")}
        </Button>
      </div>
    </div>
  );
}
