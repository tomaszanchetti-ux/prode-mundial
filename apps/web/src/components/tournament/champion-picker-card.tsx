"use client";

import React from "react";
import type { ChampionPickResponse } from "@prode/shared";
import { resolveTeamIdentity } from "@prode/shared";
import { Card, StatusTag, TeamIdentity } from "@prode/ui";

type ChampionPickerCardProps = {
  data: ChampionPickResponse | null;
  onOpen: () => void;
};

type StatusMeta = {
  label: string;
  tone: "editable" | "saved" | "closing-soon" | "live" | "scored" | "neutral";
};

function resolveStatusMeta(status: ChampionPickResponse["status"] | null | undefined): StatusMeta {
  switch (status) {
    case "picked":
      return { label: "Elegido", tone: "saved" };
    case "locked":
      return { label: "Bloqueado", tone: "neutral" };
    case "adjustment_available":
      return { label: "Ajuste disponible", tone: "live" };
    case "adjusted":
      return { label: "Ajustado", tone: "neutral" };
    case "scored":
      return { label: "Puntuado", tone: "scored" };
    case "empty":
    default:
      return { label: "Sin elegir", tone: "editable" };
  }
}

function resolveCtaLabel(status: ChampionPickResponse["status"] | null | undefined) {
  switch (status) {
    case "empty":
      return "Elegir campeon";
    case "picked":
      return "Cambiar campeon";
    case "adjustment_available":
      return "Ajustar pick";
    default:
      return "Ver tu campeon";
  }
}

export function ChampionPickerCard({ data, onOpen }: ChampionPickerCardProps) {
  const statusMeta = resolveStatusMeta(data?.status);
  const currentPickId = data?.adjustedChampionTeamId ?? data?.championTeamId ?? null;
  const ctaLabel = resolveCtaLabel(data?.status);

  const teamData = currentPickId
    ? { ...resolveTeamIdentity(currentPickId), name: currentPickId }
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left cursor-pointer w-full"
      aria-label={ctaLabel}
    >
      <Card elevated style={{ padding: 14, gap: 10 }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="typo-small text-text-muted">TU CAMPEON</span>
          </div>
          <StatusTag status={statusMeta.tone} label={statusMeta.label} />
        </div>

        <div className="flex items-center justify-between gap-3">
          {teamData ? (
            <TeamIdentity
              team={{
                teamName: teamData.name,
                fifaCode: teamData.fifaCode,
                flagAsset: teamData.flagAsset,
                flagUrl: teamData.flagUrl
              }}
              size="md"
              showFlag
              showName
              emphasis="compact"
            />
          ) : (
            <span className="text-[14px] leading-[1.4] text-text-secondary">
              Elegí la selección que levanta la copa.
            </span>
          )}
          <span className="text-[13px] text-accent-primary whitespace-nowrap">{ctaLabel} →</span>
        </div>
      </Card>
    </button>
  );
}
