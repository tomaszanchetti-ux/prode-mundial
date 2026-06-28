"use client";

import React from "react";
import type { MatchDetail } from "@prode/shared";
import { copyForLocale, type AppLocale } from "@/lib/i18n/locale-provider";

type MatchResultDetailProps = {
  detail: MatchDetail;
  locale: AppLocale;
};

/**
 * Bloque de "resultado real vs predicción + desglose" para un partido ya
 * jugado. Se muestra en el modal cuando hay officialResult (reemplaza al
 * ScoreInput, que no tiene sentido sobre un cruce terminado). Incluye el
 * +1 del bonus de penales cuando corresponde.
 */
export function MatchResultDetail({ detail, locale }: MatchResultDetailProps) {
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const official = detail.officialResult;
  if (!official) {
    return null;
  }

  const teamName = (teamId: string | null): string | null => {
    if (!teamId) return null;
    if (teamId === detail.homeTeam.teamId) return detail.homeTeam.name;
    if (teamId === detail.awayTeam.teamId) return detail.awayTeam.name;
    return null;
  };

  const isKnockout = detail.stage !== "group";
  const wasDraw = official.homeScore90 === official.awayScore90;
  const qualifiedName = teamName(official.qualifiedTeamId);
  const showQualifier = isKnockout && wasDraw && qualifiedName !== null;

  const prediction = detail.userPrediction;
  const breakdown = prediction?.scoringBreakdown;
  const advancesName = teamName(prediction?.advancesTeamPred ?? null);
  const advancerHit =
    prediction?.advancesTeamPred != null && prediction.advancesTeamPred === official.qualifiedTeamId;

  return (
    <div className="grid gap-2 p-[14px] surface-inset">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-text-secondary">{t("Resultado real", "Official result")}</span>
        <span className="text-[14px] font-semibold text-text-primary">
          {official.homeScore90} - {official.awayScore90}
          {showQualifier ? (
            <span className="text-[11px] text-text-muted font-normal">
              {" "}· {t(`pasa ${qualifiedName} (pen.)`, `${qualifiedName} advances (pen.)`)}
            </span>
          ) : null}
        </span>
      </div>

      <div className="h-px bg-border-subtle" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-text-secondary">{t("Tu predicción", "Your prediction")}</span>
        {prediction ? (
          <span className="text-[14px] font-semibold text-text-primary">
            {prediction.homeScorePred} - {prediction.awayScorePred}
            {advancesName ? (
              <span className={`text-[11px] font-medium ${advancerHit ? "text-success" : "text-text-muted"}`}>
                {" "}· {t(`elegiste ${advancesName}`, `you picked ${advancesName}`)} {advancerHit ? "✓" : "✗"}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-[13px] text-text-muted">{t("No predijiste", "No prediction")}</span>
        )}
      </div>

      {breakdown ? (
        <>
          <div className="h-px bg-border-subtle" />
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">{t("Marcador exacto", "Exact score")}</span>
              <span className="text-[12px] text-text-primary">+{breakdown.pointsExact90}</span>
            </div>
            {breakdown.pointsOutcome90 > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">{t("Solo resultado", "Outcome only")}</span>
                <span className="text-[12px] text-text-primary">+{breakdown.pointsOutcome90}</span>
              </div>
            ) : null}
            {breakdown.pointsPenalty > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">{t("Acertaste quién pasa", "Guessed who advances")}</span>
                <span className="text-[12px] text-success font-medium">+{breakdown.pointsPenalty}</span>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {prediction?.pointsAwarded != null ? (
        <div className="flex justify-center pt-1">
          <span
            className={`text-[13px] font-bold uppercase tracking-wide px-3 py-1 rounded-pill ${
              prediction.pointsAwarded > 0 ? "text-success bg-success-soft" : "text-text-muted bg-bg-interactive"
            }`}
          >
            {t(`Total: +${prediction.pointsAwarded} pts`, `Total: +${prediction.pointsAwarded} pts`)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
