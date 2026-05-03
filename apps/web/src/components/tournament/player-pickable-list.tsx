"use client";

import React, { useMemo, useState } from "react";
import { resolveTeamIdentity, type BestPlayerRosterEntry } from "@prode/shared";
import { TeamIdentity } from "@prode/ui";

export type PlayerPickableListProps = {
  items: readonly BestPlayerRosterEntry[];
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
  disabledItems?: Set<string>;
  disabledHint?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

const POSITION_LABEL: Record<BestPlayerRosterEntry["position"], string> = {
  GK: "ARQ",
  DEF: "DEF",
  MID: "MED",
  FWD: "DEL"
};

// Roster resolution order: group by teamId, teams sorted by fifaCode, players
// inside each team sorted by position then name.
const POSITION_ORDER: Record<BestPlayerRosterEntry["position"], number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3
};

export function PlayerPickableList({
  items,
  selectedPlayerId,
  onSelect,
  disabledItems,
  disabledHint,
  searchPlaceholder = "Buscar jugador o equipo...",
  emptyMessage = "No se encontraron jugadores."
}: PlayerPickableListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamId.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, BestPlayerRosterEntry[]>();
    for (const p of filtered) {
      const existing = map.get(p.teamId);
      if (existing) {
        existing.push(p);
      } else {
        map.set(p.teamId, [p]);
      }
    }
    for (const [, players] of map) {
      players.sort((a, b) => {
        const byPos = POSITION_ORDER[a.position] - POSITION_ORDER[b.position];
        if (byPos !== 0) return byPos;
        return a.name.localeCompare(b.name);
      });
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="grid gap-3">
      <input
        type="search"
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
      />

      {grouped.length === 0 ? (
        <p className="text-[14px] text-text-muted text-center py-4 m-0">{emptyMessage}</p>
      ) : null}

      {grouped.map(([teamId, players]) => {
        const identity = resolveTeamIdentity(teamId);
        return (
          <div key={teamId} className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <TeamIdentity
                team={{
                  teamName: teamId,
                  fifaCode: identity.fifaCode,
                  flagAsset: identity.flagAsset,
                  flagUrl: identity.flagUrl
                }}
                size="sm"
                showFlag
                showName={false}
                emphasis="compact"
              />
              <span className="typo-small text-text-muted">{teamId}</span>
            </div>
            <ul className="grid gap-1 m-0 p-0 list-none" role="listbox" aria-label={`Jugadores de ${teamId}`}>
              {players.map((player) => {
                const isSelected = player.playerId === selectedPlayerId;
                const isDisabled = disabledItems?.has(player.playerId) ?? false;

                return (
                  <li key={player.playerId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => onSelect(player.playerId)}
                      className={`w-full flex items-center justify-between gap-3 rounded-md px-3 py-2.5 border transition-colors text-left ${
                        isDisabled
                          ? "border-border-subtle bg-surface-default opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "border-accent-primary bg-accent-primary/10 ring-1 ring-accent-primary/30 cursor-pointer"
                            : "border-border-subtle bg-surface-default hover:bg-surface-raised cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[14px] font-medium text-text-primary truncate">{player.name}</span>
                        <span className="text-[12px] text-text-muted truncate">{player.club}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-text-muted px-1.5 py-0.5 rounded bg-surface-raised">
                          {POSITION_LABEL[player.position]}
                        </span>
                        {isSelected ? (
                          <span className="text-[13px] text-accent-primary whitespace-nowrap">✓ elegido</span>
                        ) : isDisabled && disabledHint ? (
                          <span className="text-[11px] text-text-muted whitespace-nowrap">{disabledHint}</span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
