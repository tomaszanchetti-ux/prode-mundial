import React from "react";
import type { ChampionPickResponse, SubChampionPickResponse } from "@prode/shared";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type MisPicksWidgetProps = {
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  onOpenPicks: () => void;
};

export function MisPicksWidget({ championPick, subChampionPick, onOpenPicks }: MisPicksWidgetProps) {
  const { locale } = useLocale();

  const championId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const subChampionId =
    subChampionPick?.adjustedSubChampionTeamId ?? subChampionPick?.subChampionTeamId ?? null;

  const emptyLabel = copyForLocale(locale, "sin elegir", "not picked");
  const comingSoonLabel = copyForLocale(locale, "proximamente", "coming soon");

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
          value={null}
          placeholder={comingSoonLabel}
          placeholderTone="muted"
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
