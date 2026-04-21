import React from "react";
import type { LeagueSummary, PointsResponse } from "@prode/shared";
import { Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type HomeSummaryCardProps = {
  points: PointsResponse | null;
  leagues: LeagueSummary[];
  scored: number;
  pending: number;
  onOpen: () => void;
};

export function HomeSummaryCard({ points, leagues, scored, pending, onOpen }: HomeSummaryCardProps) {
  const { locale } = useLocale();
  const total = points?.totalPoints ?? 0;
  const exactHits = points?.exactHits ?? 0;
  const correctSigns = points?.correctSigns ?? 0;
  const macro = points?.macroPoints ?? 0;
  const hasActivity = total > 0 || exactHits > 0 || correctSigns > 0 || macro > 0;

  const topLeague = leagues[0] ?? null;

  const totalRelevant = scored + pending;
  const percentage = totalRelevant > 0 ? Math.round((scored / totalRelevant) * 100) : 0;

  return (
    <Card
      as="button"
      type="button"
      elevated
      onClick={onOpen}
      aria-label={copyForLocale(locale, "Ver mi resumen", "See my summary")}
      className="text-left w-full cursor-pointer"
      style={{ gap: 12, padding: 16 }}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1 min-w-0">
          <span className="typo-eyebrow text-primary-600">
            {copyForLocale(locale, "MI SCORE", "MY SCORE")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] leading-none font-black text-text-primary tabular-nums">
              {total}
            </span>
            <span className="text-[14px] text-text-muted">
              {copyForLocale(locale, "pts", "pts")}
            </span>
          </div>
        </div>
        {topLeague ? (
          <div className="grid gap-0.5 text-right min-w-0">
            <span className="text-[22px] leading-none font-black text-text-primary tabular-nums">
              {topLeague.position != null ? `#${topLeague.position}` : "—"}
            </span>
            <span className="typo-meta truncate max-w-[160px]">
              {topLeague.name}
            </span>
          </div>
        ) : null}
      </div>

      {hasActivity ? (
        <p className="m-0 typo-small text-text-secondary tabular-nums">
          <span className="text-text-primary font-semibold">{exactHits}</span>{" "}
          {copyForLocale(locale, "exactos", "exact")}
          <span className="text-text-muted"> · </span>
          <span className="text-text-primary font-semibold">{correctSigns}</span>{" "}
          {copyForLocale(locale, "signos", "outcomes")}
          <span className="text-text-muted"> · </span>
          <span className="text-text-primary font-semibold">{macro}</span>{" "}
          {copyForLocale(locale, "picks", "picks")}
        </p>
      ) : null}

      <div className="grid gap-1">
        <div className="h-1.5 w-full rounded-pill bg-bg-muted overflow-hidden">
          <div
            className="h-full bg-success rounded-pill transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="typo-meta tabular-nums">
          {scored}/{totalRelevant} {copyForLocale(locale, "predicciones", "predictions")}
          <span className="text-text-muted"> · {percentage}%</span>
        </span>
      </div>
    </Card>
  );
}
