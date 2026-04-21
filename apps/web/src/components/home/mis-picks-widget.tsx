import React from "react";
import type { BestPlayerPickResponse, ChampionPickResponse, SubChampionPickResponse } from "@prode/shared";
import { getBestPlayerById } from "@prode/shared";
import { Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type MisPicksWidgetProps = {
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  onOpenPicks: () => void;
};

export function MisPicksWidget({
  championPick,
  subChampionPick,
  bestPlayerPick,
  onOpenPicks
}: MisPicksWidgetProps) {
  const { locale } = useLocale();

  const championId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const subChampionId =
    subChampionPick?.adjustedSubChampionTeamId ?? subChampionPick?.subChampionTeamId ?? null;
  const bestPlayerId = bestPlayerPick?.adjustedBestPlayerId ?? bestPlayerPick?.bestPlayerId ?? null;
  const bestPlayerName = bestPlayerId ? getBestPlayerById(bestPlayerId)?.name ?? null : null;

  const emptyLabel = copyForLocale(locale, "—", "—");

  return (
    <Card
      as="button"
      type="button"
      elevated
      onClick={onOpenPicks}
      aria-label={copyForLocale(locale, "Ver mis picks", "See my picks")}
      className="text-left w-full cursor-pointer"
      style={{ gap: 8, padding: 16 }}
    >
      <span className="typo-eyebrow text-text-muted uppercase">
        {copyForLocale(locale, "MIS PICKS", "MY PICKS")}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 typo-small">
        <PickInline
          label={copyForLocale(locale, "Campeon", "Champion")}
          value={championId}
          empty={emptyLabel}
        />
        <span className="text-text-muted">·</span>
        <PickInline
          label={copyForLocale(locale, "Sub", "Sub")}
          value={subChampionId}
          empty={emptyLabel}
        />
        <span className="text-text-muted">·</span>
        <PickInline
          label={copyForLocale(locale, "Balon", "Golden")}
          value={bestPlayerName}
          empty={emptyLabel}
        />
      </div>
    </Card>
  );
}

function PickInline({ label, value, empty }: { label: string; value: string | null; empty: string }) {
  return (
    <span>
      <span className="text-text-muted">{label} </span>
      <strong className="text-text-primary tabular-nums">{value ?? empty}</strong>
    </span>
  );
}
