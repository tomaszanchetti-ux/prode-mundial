"use client";

import React from "react";
import type {
  BestPlayerPickResponse,
  ChampionPickResponse,
  SubChampionPickResponse
} from "@prode/shared";
import { getBestPlayerById, resolveTeamIdentity } from "@prode/shared";
import { Card, TeamIdentity } from "@prode/ui";

type PicksTab = "champion" | "sub-champion" | "best-player";

type MisPicksSectionProps = {
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  onOpenPicks: (tab?: PicksTab) => void;
};

type CompactPickRowProps = {
  eyebrow: string;
  placeholder: string;
  onClick: () => void;
  team?: {
    teamName: string;
    fifaCode: string | null;
    flagAsset: string | null;
    flagUrl: string | null;
  } | null;
  secondaryLabel?: string | null;
  primaryLabel?: string | null;
  isFirst?: boolean;
};

function CompactPickRow({
  eyebrow,
  placeholder,
  onClick,
  team,
  secondaryLabel,
  primaryLabel,
  isFirst
}: CompactPickRowProps) {
  const hasPick = team != null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer hover:bg-bg-interactive transition-colors ${
        isFirst ? "" : "border-t border-border-subtle"
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="typo-eyebrow text-primary-600">{eyebrow}</span>
        {hasPick ? (
          <div className="flex items-center gap-2 min-w-0">
            <TeamIdentity team={team!} size="sm" showName={false} />
            <span className="text-[15px] font-semibold text-text-primary truncate">
              {primaryLabel ?? team!.teamName}
            </span>
            {secondaryLabel ? (
              <span className="text-[12px] text-text-muted truncate">{secondaryLabel}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-[14px] text-text-secondary">{placeholder}</span>
        )}
      </div>
      <span aria-hidden="true" className="text-text-muted text-[18px] leading-none shrink-0">
        ›
      </span>
    </button>
  );
}

export function MisPicksSection({
  championPick,
  subChampionPick,
  bestPlayerPick,
  onOpenPicks
}: MisPicksSectionProps) {
  const championTeamId =
    championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const subTeamId =
    subChampionPick?.adjustedSubChampionTeamId ?? subChampionPick?.subChampionTeamId ?? null;
  const bestPlayerId =
    bestPlayerPick?.adjustedBestPlayerId ?? bestPlayerPick?.bestPlayerId ?? null;

  const championTeam = championTeamId
    ? (() => {
        const identity = resolveTeamIdentity(championTeamId);
        return {
          teamName: championTeamId,
          fifaCode: identity.fifaCode,
          flagAsset: identity.flagAsset,
          flagUrl: identity.flagUrl
        };
      })()
    : null;

  const subTeam = subTeamId
    ? (() => {
        const identity = resolveTeamIdentity(subTeamId);
        return {
          teamName: subTeamId,
          fifaCode: identity.fifaCode,
          flagAsset: identity.flagAsset,
          flagUrl: identity.flagUrl
        };
      })()
    : null;

  const player = bestPlayerId ? getBestPlayerById(bestPlayerId) : null;
  const playerTeam = player
    ? (() => {
        const identity = resolveTeamIdentity(player.teamId);
        return {
          teamName: player.teamId,
          fifaCode: identity.fifaCode,
          flagAsset: identity.flagAsset,
          flagUrl: identity.flagUrl
        };
      })()
    : null;

  return (
    <Card elevated style={{ padding: 0, gap: 0 }} aria-labelledby="mis-picks-heading">
      <CompactPickRow
        eyebrow="Mi Campeón"
        placeholder="Elegí tu campeón"
        onClick={() => onOpenPicks("champion")}
        team={championTeam}
        isFirst
      />
      <CompactPickRow
        eyebrow="Mi Sub-Campeón"
        placeholder="Elegí tu sub-campeón"
        onClick={() => onOpenPicks("sub-champion")}
        team={subTeam}
      />
      <CompactPickRow
        eyebrow="Balón de Oro"
        placeholder="Elegí al mejor jugador"
        onClick={() => onOpenPicks("best-player")}
        team={playerTeam}
        primaryLabel={player?.name ?? null}
        secondaryLabel={player ? `${player.club} · ${player.position}` : null}
      />
    </Card>
  );
}
