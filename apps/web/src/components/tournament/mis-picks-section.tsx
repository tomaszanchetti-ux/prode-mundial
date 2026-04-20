"use client";

import React from "react";
import type { ChampionPickResponse, SubChampionPickResponse } from "@prode/shared";
import { ChampionPickerCard } from "./champion-picker-card";
import { SubChampionPickerCard } from "./sub-champion-picker-card";
import { GoldenBallCard } from "./golden-ball-card";

type MisPicksSectionProps = {
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  onOpenChampionPicker: () => void;
};

export function MisPicksSection({
  championPick,
  subChampionPick,
  onOpenChampionPicker
}: MisPicksSectionProps) {
  return (
    <section className="grid gap-3" aria-labelledby="mis-picks-heading">
      <span id="mis-picks-heading" className="typo-small text-text-muted">
        MIS PICKS
      </span>

      <ChampionPickerCard data={championPick} onOpen={onOpenChampionPicker} />

      <SubChampionPickerCard
        data={subChampionPick}
        championPick={championPick}
        onOpen={onOpenChampionPicker}
      />

      <GoldenBallCard />
    </section>
  );
}
