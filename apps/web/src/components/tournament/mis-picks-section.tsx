"use client";

import React from "react";
import type { ChampionPickResponse, SubChampionPickResponse } from "@prode/shared";
import { ChampionPickerCard } from "./champion-picker-card";
import { SubChampionPickerCard } from "./sub-champion-picker-card";
import { GoldenBallCard } from "./golden-ball-card";

type PicksTab = "champion" | "sub-champion" | "best-player";

type MisPicksSectionProps = {
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  onOpenPicks: (tab?: PicksTab) => void;
};

export function MisPicksSection({
  championPick,
  subChampionPick,
  onOpenPicks
}: MisPicksSectionProps) {
  return (
    <section className="grid gap-3" aria-labelledby="mis-picks-heading">
      <span id="mis-picks-heading" className="typo-small text-text-muted">
        MIS PICKS
      </span>

      <ChampionPickerCard data={championPick} onOpen={() => onOpenPicks("champion")} />

      <SubChampionPickerCard
        data={subChampionPick}
        championPick={championPick}
        onOpen={() => onOpenPicks("sub-champion")}
      />

      <GoldenBallCard />
    </section>
  );
}
