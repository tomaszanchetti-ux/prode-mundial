import React from "react";
import { MATCH_SCORING_RULES, type PointsResponse } from "@prode/shared";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

export function MiScoreSection({ points }: { points: PointsResponse | null }) {
  const { locale } = useLocale();

  const total = points?.totalPoints ?? 0;
  const exactHits = points?.exactHits ?? 0;
  const correctSigns = points?.correctSigns ?? 0;
  const macro = points?.macroPoints ?? 0;
  const hasActivity = total > 0 || exactHits > 0 || correctSigns > 0 || macro > 0;

  return (
    <div className="grid gap-2">
      <span className="typo-eyebrow text-text-muted uppercase">
        {copyForLocale(locale, "MI SCORE", "MY SCORE")}
      </span>

      <div className="flex items-baseline gap-2">
        <span className="text-[36px] leading-none font-black text-text-primary tabular-nums">
          {total}
        </span>
        <span className="text-[14px] text-text-muted">
          {copyForLocale(locale, "pts totales", "total pts")}
        </span>
      </div>

      {hasActivity ? (
        <p className="m-0 typo-small text-text-secondary tabular-nums">
          <span className="text-text-primary font-semibold">{exactHits}</span>{" "}
          {copyForLocale(locale, "exactos", "exact")}{" "}
          <span className="text-text-muted">({MATCH_SCORING_RULES.exact90Points} pts)</span>
          <span className="text-text-muted"> · </span>
          <span className="text-text-primary font-semibold">{correctSigns}</span>{" "}
          {copyForLocale(locale, "signos", "outcomes")}{" "}
          <span className="text-text-muted">({MATCH_SCORING_RULES.correctOutcome90Points} pts)</span>
          <span className="text-text-muted"> · </span>
          <span className="text-text-primary font-semibold">{macro}</span>{" "}
          {copyForLocale(locale, "pts picks", "pick pts")}
        </p>
      ) : (
        <p className="m-0 typo-small text-text-secondary">
          {copyForLocale(
            locale,
            "Todavia no sumaste. Predeci el proximo partido para arrancar.",
            "No points yet. Predict the next match to get started."
          )}
        </p>
      )}
    </div>
  );
}
