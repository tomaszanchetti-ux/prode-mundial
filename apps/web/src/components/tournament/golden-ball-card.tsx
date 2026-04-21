"use client";

import React, { useEffect, useState } from "react";
import type { BestPlayerPickResponse, TournamentPickWindow } from "@prode/shared";
import { getBestPlayerById, resolveTeamIdentity } from "@prode/shared";
import { Button, Card, StatusTag, TeamIdentity } from "@prode/ui";
import type { StatusTone } from "@prode/ui";

type GoldenBallCardProps = {
  data: BestPlayerPickResponse | null;
  onOpen: () => void;
};

type StatusMeta = {
  label: string;
  tone: StatusTone;
};

function resolveStatusMeta(status: BestPlayerPickResponse["status"] | null | undefined): StatusMeta {
  switch (status) {
    case "picked":
      return { label: "Guardado", tone: "saved" };
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
      return { label: "Pendiente", tone: "editable" };
  }
}

function resolveCtaLabel(status: BestPlayerPickResponse["status"] | null | undefined) {
  if (status === "empty" || status == null) return "Elegir";
  return "Modificar";
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

export function GoldenBallCard({ data, onOpen }: GoldenBallCardProps) {
  const nowMs = useTicker();

  const statusMeta = resolveStatusMeta(data?.status);
  const currentPickId = data?.adjustedBestPlayerId ?? data?.bestPlayerId ?? null;
  const ctaLabel = resolveCtaLabel(data?.status);

  const player = currentPickId ? getBestPlayerById(currentPickId) : null;
  const identity = player ? resolveTeamIdentity(player.teamId) : null;

  const windowMeta = data
    ? resolveWindowMeta(data.pickWindow, data.pickWindowPointValue, data.pickWindowClosesAt, nowMs)
    : null;

  return (
    <Card elevated style={{ padding: 14, gap: 10 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="typo-small text-text-muted">MI BALÓN DE ORO</span>
        <StatusTag status={statusMeta.tone} label={statusMeta.label} />
      </div>

      {player && identity ? (
        <div className="flex items-center gap-3">
          <TeamIdentity
            team={{
              teamName: player.teamId,
              fifaCode: identity.fifaCode,
              flagAsset: identity.flagAsset,
              flagUrl: identity.flagUrl
            }}
            size="md"
            showFlag
            showName={false}
            emphasis="compact"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-text-primary truncate">{player.name}</span>
            <span className="text-[12px] text-text-muted truncate">{player.club} · {player.position}</span>
          </div>
        </div>
      ) : (
        <span className="text-[14px] leading-[1.4] text-text-secondary">
          Elegí al mejor jugador del Mundial.
        </span>
      )}

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border-subtle">
        {windowMeta ? (
          <div className="grid gap-0.5">
            <StatusTag status={windowMeta.badgeTone} label={windowMeta.badgeLabel} />
            {windowMeta.helperText ? (
              <span className="text-[12px] leading-[1.3] text-text-muted tabular-nums">
                {windowMeta.helperText}
              </span>
            ) : null}
          </div>
        ) : (
          <span />
        )}
        <Button variant="primary" onClick={onOpen}>
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
