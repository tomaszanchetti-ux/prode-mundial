"use client";

import React from "react";
import type { TeamRef } from "@prode/shared";
import { TeamIdentity } from "@prode/ui";
import { copyForLocale, type AppLocale } from "@/lib/i18n/locale-provider";

type AdvancerSelectProps = {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  value: string | null;
  onChange: (teamId: string) => void;
  disabled?: boolean;
  locale: AppLocale;
  /** Marca el campo como obligatorio sin resolver (resalta el borde y muestra hint). */
  invalid?: boolean;
};

/**
 * Selector "¿Quién pasa?" — aparece solo en cruces cuando la predicción es empate.
 * Elegís cuál de los dos equipos clasifica (penales). Acertar suma 1 punto extra.
 */
export function AdvancerSelect({
  homeTeam,
  awayTeam,
  value,
  onChange,
  disabled = false,
  locale,
  invalid = false
}: AdvancerSelectProps) {
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  return (
    <div className="grid gap-2.5">
      <div className="grid gap-0.5">
        <span className="text-[14px] font-semibold text-text-primary">
          {t("¿Quién pasa a la siguiente ronda?", "Who advances to the next round?")}
        </span>
        <span className="typo-small text-text-muted">
          {t("Acertar quién pasa de fase te da 1 punto extra.", "Guessing who advances earns you 1 extra point.")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[homeTeam, awayTeam].map((team) => {
          const isSelected = value === team.teamId;

          return (
            <button
              key={team.teamId}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(team.teamId)}
              className={[
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                isSelected
                  ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50,var(--color-bg-muted))]"
                  : invalid
                    ? "border-[var(--color-danger-400,var(--color-border-strong))] hover:border-[var(--color-border-strong)]"
                    : "border-border-subtle hover:border-border-strong"
              ].join(" ")}
            >
              <TeamIdentity team={team} size="sm" emphasis="compact" showFlag align="center" />
              {isSelected ? (
                <span aria-hidden="true" className="text-[13px] font-bold text-[var(--color-primary-600,var(--color-primary-500))]">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {invalid ? (
        <span className="typo-small text-[var(--color-danger-500,var(--color-text-secondary))]">
          {t("Elegí quién pasa para guardar.", "Pick who advances to save.")}
        </span>
      ) : null}
    </div>
  );
}

/**
 * El selector aplica solo en knockouts cuando el marcador ingresado es empate
 * (ambos llenos e iguales). En grupos o con un ganador, no se pide.
 */
export function asksAdvancer(stage: string, homeScorePred: string, awayScorePred: string): boolean {
  if (stage === "group") {
    return false;
  }

  if (homeScorePred === "" || awayScorePred === "") {
    return false;
  }

  return Number(homeScorePred) === Number(awayScorePred);
}
