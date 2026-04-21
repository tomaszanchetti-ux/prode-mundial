"use client";

import React, { useMemo, useState } from "react";
import { resolveTeamIdentity } from "@prode/shared";
import { TeamIdentity } from "@prode/ui";

export type PickableListItem = {
  teamId: string;
  teamName: string;
  groupId: string;
};

type PickableListProps = {
  items: PickableListItem[];
  selectedTeamId: string | null;
  onSelect: (teamId: string) => void;
  disabledItems?: Set<string>;
  disabledHint?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function PickableList({
  items,
  selectedTeamId,
  onSelect,
  disabledItems,
  disabledHint,
  searchPlaceholder = "Buscar seleccion...",
  emptyMessage = "No se encontraron selecciones."
}: PickableListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.teamName.toLowerCase().includes(q) || it.teamId.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PickableListItem[]>();
    for (const it of filtered) {
      const existing = map.get(it.groupId);
      if (existing) {
        existing.push(it);
      } else {
        map.set(it.groupId, [it]);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="grid gap-3">
      <input
        type="search"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
      />

      {grouped.length === 0 ? (
        <p className="text-[14px] text-text-muted text-center py-4 m-0">{emptyMessage}</p>
      ) : null}

      {grouped.map(([groupId, teams]) => (
        <div key={groupId} className="grid gap-1.5">
          <span className="typo-eyebrow">GRUPO {groupId}</span>
          <ul className="grid gap-1 m-0 p-0 list-none" role="listbox" aria-label={`Grupo ${groupId}`}>
            {teams.map((team) => {
              const identity = resolveTeamIdentity(team.teamId);
              const isSelected = team.teamId === selectedTeamId;
              const isDisabled = disabledItems?.has(team.teamId) ?? false;

              return (
                <li key={team.teamId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => onSelect(team.teamId)}
                    className={`w-full flex items-center justify-between gap-3 rounded-md px-3 py-2.5 border transition-colors text-left ${
                      isDisabled
                        ? "border-border-subtle bg-surface-default opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "border-accent-primary bg-accent-primary/10 ring-1 ring-accent-primary/30 cursor-pointer"
                          : "border-border-subtle bg-surface-default hover:bg-surface-raised cursor-pointer"
                    }`}
                  >
                    <TeamIdentity
                      team={{
                        teamName: team.teamName,
                        fifaCode: identity.fifaCode,
                        flagAsset: identity.flagAsset,
                        flagUrl: identity.flagUrl
                      }}
                      size="sm"
                      showFlag
                      showName
                      emphasis="compact"
                    />
                    {isSelected ? (
                      <span className="text-[13px] text-accent-primary whitespace-nowrap">✓ elegido</span>
                    ) : isDisabled && disabledHint ? (
                      <span className="text-[11px] text-text-muted whitespace-nowrap">{disabledHint}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
