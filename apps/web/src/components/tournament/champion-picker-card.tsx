"use client";

import React, { useEffect, useState } from "react";
import type { ChampionPickResponse, TournamentPickWindow } from "@prode/shared";
import { resolveTeamIdentity } from "@prode/shared";
import { Card, StatusTag, TeamIdentity } from "@prode/ui";
import type { StatusTone } from "@prode/ui";

type ChampionPickerCardProps = {
  data: ChampionPickResponse | null;
  onOpen: () => void;
};

type StatusMeta = {
  label: string;
  tone: StatusTone;
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

function formatRemaining(closesAtMs: number, nowMs: number): string | null {
  const diffMs = closesAtMs - nowMs;
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type WindowMeta = {
  badgeLabel: string;
  badgeTone: StatusTone;
  helperText: string | null;
};

function resolveWindowMeta(
  pickWindow: TournamentPickWindow,
  pointValue: number,
  closesAt: string | null,
  nowMs: number
): WindowMeta {
  switch (pickWindow) {
    case "A": {
      const remaining = closesAt ? formatRemaining(new Date(closesAt).getTime(), nowMs) : null;
      return {
        badgeLabel: `Ventana A · ${pointValue} pts`,
        badgeTone: "live",
        helperText: remaining ? `Cierra en ${remaining}` : null
      };
    }
    case "B": {
      const remaining = closesAt ? formatRemaining(new Date(closesAt).getTime(), nowMs) : null;
      return {
        badgeLabel: `Ventana B · ${pointValue} pts`,
        badgeTone: "closing-soon",
        helperText: remaining ? `Ajuste disponible. Cierra en ${remaining}` : null
      };
    }
    case "closed":
    default:
      return {
        badgeLabel: "Pick bloqueado",
        badgeTone: "neutral",
        helperText: null
      };
  }
}

function useTicker(intervalMs = 60_000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function ChampionPickerCard({ data, onOpen }: ChampionPickerCardProps) {
  const nowMs = useTicker();

  const statusMeta = resolveStatusMeta(data?.status);
  const currentPickId = data?.adjustedChampionTeamId ?? data?.championTeamId ?? null;
  const ctaLabel = resolveCtaLabel(data?.status);

  const teamData = currentPickId
    ? { ...resolveTeamIdentity(currentPickId), name: currentPickId }
    : null;

  const windowMeta = data
    ? resolveWindowMeta(data.pickWindow, data.pickWindowPointValue, data.pickWindowClosesAt, nowMs)
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

        {windowMeta ? (
          <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
            <StatusTag status={windowMeta.badgeTone} label={windowMeta.badgeLabel} />
            {windowMeta.helperText ? (
              <span className="text-[12px] leading-[1.3] text-text-muted tabular-nums">
                {windowMeta.helperText}
              </span>
            ) : null}
          </div>
        ) : null}
      </Card>
    </button>
  );
}
