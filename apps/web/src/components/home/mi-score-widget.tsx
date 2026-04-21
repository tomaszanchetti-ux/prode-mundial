import React from "react";
import type { LeagueSummary, PointsResponse } from "@prode/shared";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type MiScoreWidgetProps = {
  points: PointsResponse | null;
  leagues: LeagueSummary[];
  onOpenLeagues: () => void;
};

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
          <span className="text-text-muted">(4 pts)</span>
          <span className="text-text-muted"> · </span>
          <span className="text-text-primary font-semibold">{correctSigns}</span>{" "}
          {copyForLocale(locale, "signos", "outcomes")}{" "}
          <span className="text-text-muted">(2 pts)</span>
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

export function MiScoreWidget({ points, leagues, onOpenLeagues }: MiScoreWidgetProps) {
  const { locale } = useLocale();
  const hasLeagues = leagues.length > 0;

  return (
    <Card elevated style={{ gap: 14, padding: 16 }}>
      <MiScoreSection points={points} />

      <div className="h-px bg-border-subtle" />

      {hasLeagues ? (
        <ul className="grid gap-3 list-none p-0 m-0">
          {leagues.map((league, idx) => (
            <li
              key={league.leagueId}
              className={`grid gap-3 ${idx > 0 ? "pt-3 border-t border-border-subtle" : ""}`.trim()}
            >
              <h3 className="typo-h3 m-0 text-text-primary truncate">{league.name}</h3>

              <div className="grid grid-cols-3 gap-2">
                <LeagueMetric
                  value={league.position != null ? `#${league.position}` : "—"}
                  label={copyForLocale(locale, "posicion", "position")}
                />
                <LeagueMetric
                  value={league.userPoints.toString()}
                  label={copyForLocale(locale, "puntos", "points")}
                />
                <LeagueMetric
                  value={league.membersCount.toString()}
                  label={copyForLocale(locale, "jugadores", "players")}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 typo-small text-text-secondary">
          {copyForLocale(
            locale,
            "Todavia no estas en ninguna liga. Crea una o uni amigos con un codigo.",
            "You're not in any league yet. Create one or join friends with a code."
          )}
        </p>
      )}

      <Button variant="secondary" onClick={onOpenLeagues}>
        {hasLeagues
          ? copyForLocale(locale, "Ver ligas", "See leagues")
          : copyForLocale(locale, "Crear liga", "Create league")}
      </Button>
    </Card>
  );
}

function LeagueMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid gap-0.5 justify-items-center text-center">
      <span className="text-[22px] leading-none font-black text-text-primary tabular-nums">
        {value}
      </span>
      <span className="text-[11px] leading-[1.2] uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}
