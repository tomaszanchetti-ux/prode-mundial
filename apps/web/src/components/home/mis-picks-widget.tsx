import React from "react";
import type { BestPlayerPickResponse, ChampionPickResponse, SubChampionPickResponse } from "@prode/shared";
import { getBestPlayerById } from "@prode/shared";
import { Button, Card } from "@prode/ui";
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
  // Si hay playerId salvado pero el roster ya no lo tiene (post data-swap FIFA),
  // diferenciar "stale" de "sin elegir" — el user sí hizo pick, solo que es inválido.
  const bestPlayerStale = bestPlayerId !== null && bestPlayerName === null;

  const emptyLabel = copyForLocale(locale, "sin elegir", "not picked");
  const stalePlayerLabel = copyForLocale(locale, "jugador no disponible", "player unavailable");

  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <span className="typo-eyebrow text-text-muted uppercase">
        {copyForLocale(locale, "MIS PICKS", "MY PICKS")}
      </span>

      <ul className="grid gap-2 list-none p-0 m-0">
        <PickRow
          label={copyForLocale(locale, "Campeon", "Champion")}
          value={championId}
          placeholder={emptyLabel}
        />
        <PickRow
          label={copyForLocale(locale, "Sub-Campeon", "Sub-Champion")}
          value={subChampionId}
          placeholder={emptyLabel}
        />
        <PickRow
          label={copyForLocale(locale, "Balon de Oro", "Golden Ball")}
          value={bestPlayerName}
          placeholder={bestPlayerStale ? stalePlayerLabel : emptyLabel}
          placeholderTone={bestPlayerStale ? "muted" : "italic"}
        />
      </ul>

      <Button variant="secondary" onClick={onOpenPicks}>
        {copyForLocale(locale, "Ver picks", "See picks")}
      </Button>
    </Card>
  );
}

function PickRow({
  label,
  value,
  placeholder,
  placeholderTone = "italic"
}: {
  label: string;
  value: string | null;
  placeholder: string;
  placeholderTone?: "italic" | "muted";
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="typo-small text-text-muted">{label}</span>
      {value ? (
        <strong className="text-[14px] leading-[1.2] text-text-primary tabular-nums">
          {value}
        </strong>
      ) : (
        <span
          className={
            placeholderTone === "italic"
              ? "text-[13px] leading-[1.2] text-text-muted italic"
              : "text-[13px] leading-[1.2] text-text-muted"
          }
        >
          {placeholder}
        </span>
      )}
    </li>
  );
}
