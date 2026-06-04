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

// Orden de jugadores dentro de cada equipo: por posición y luego por nombre.
const POSITION_ORDER: Record<BestPlayerRosterEntry["position"], number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3
};

// Nombres de selección en español por fifaCode (para chips y búsqueda).
const COUNTRY_ES: Record<string, string> = {
  ALG: "Argelia", ARG: "Argentina", AUS: "Australia", AUT: "Austria",
  BEL: "Bélgica", BIH: "Bosnia y Herzegovina", BRA: "Brasil", CAN: "Canadá",
  CIV: "Costa de Marfil", COD: "RD del Congo", COL: "Colombia", CPV: "Cabo Verde",
  CRO: "Croacia", CUW: "Curazao", CZE: "Chequia", ECU: "Ecuador", EGY: "Egipto",
  ENG: "Inglaterra", ESP: "España", FRA: "Francia", GER: "Alemania", GHA: "Ghana",
  HAI: "Haití", IRN: "Irán", IRQ: "Irak", JOR: "Jordania", JPN: "Japón",
  KOR: "Corea del Sur", KSA: "Arabia Saudita", MAR: "Marruecos", MEX: "México",
  NED: "Países Bajos", NOR: "Noruega", NZL: "Nueva Zelanda", PAN: "Panamá",
  PAR: "Paraguay", POR: "Portugal", QAT: "Catar", RSA: "Sudáfrica", SCO: "Escocia",
  SEN: "Senegal", SUI: "Suiza", SWE: "Suecia", TUN: "Túnez", TUR: "Turquía",
  URU: "Uruguay", USA: "Estados Unidos", UZB: "Uzbekistán"
};

function teamName(teamId: string): string {
  return COUNTRY_ES[teamId] ?? teamId;
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function sortPlayers(players: BestPlayerRosterEntry[]): BestPlayerRosterEntry[] {
  return [...players].sort((a, b) => {
    const byPos = POSITION_ORDER[a.position] - POSITION_ORDER[b.position];
    if (byPos !== 0) return byPos;
    return a.name.localeCompare(b.name);
  });
}

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
  // Si ya hay un pick guardado, arrancamos parados en su selección.
  const initialTeam = useMemo(() => {
    if (!selectedPlayerId) return null;
    return items.find((p) => p.playerId === selectedPlayerId)?.teamId ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialTeam);

  const q = fold(query.trim());
  const isSearching = q.length > 0;

  // Jugadores por equipo (precalculado).
  const byTeam = useMemo(() => {
    const map = new Map<string, BestPlayerRosterEntry[]>();
    for (const p of items) {
      const arr = map.get(p.teamId);
      if (arr) arr.push(p);
      else map.set(p.teamId, [p]);
    }
    return map;
  }, [items]);

  const teamCodes = useMemo(
    () => Array.from(byTeam.keys()).sort((a, b) => teamName(a).localeCompare(teamName(b))),
    [byTeam]
  );

  // Resultados de búsqueda global, agrupados por equipo.
  const searchGroups = useMemo(() => {
    if (!isSearching) return [];
    const matches = items.filter(
      (p) =>
        fold(p.name).includes(q) ||
        fold(p.club).includes(q) ||
        fold(p.teamId).includes(q) ||
        fold(teamName(p.teamId)).includes(q)
    );
    const map = new Map<string, BestPlayerRosterEntry[]>();
    for (const p of matches) {
      const arr = map.get(p.teamId);
      if (arr) arr.push(p);
      else map.set(p.teamId, [p]);
    }
    return Array.from(map.entries())
      .map(([code, players]) => [code, sortPlayers(players)] as const)
      .sort(([a], [b]) => teamName(a).localeCompare(teamName(b)));
  }, [items, q, isSearching]);

  const teamAllDisabled = (code: string): boolean => {
    if (!disabledItems || disabledItems.size === 0) return false;
    const players = byTeam.get(code) ?? [];
    return players.length > 0 && players.every((p) => disabledItems.has(p.playerId));
  };

  function PlayerRow({ player }: { player: BestPlayerRosterEntry }) {
    const isSelected = player.playerId === selectedPlayerId;
    const isDisabled = disabledItems?.has(player.playerId) ?? false;
    return (
      <li>
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
  }

  function TeamHeader({ code }: { code: string }) {
    const identity = resolveTeamIdentity(code);
    return (
      <div className="flex items-center gap-2">
        <TeamIdentity
          team={{ teamName: teamName(code), fifaCode: identity.fifaCode, flagAsset: identity.flagAsset, flagUrl: identity.flagUrl }}
          size="sm"
          showFlag
          showName={false}
          emphasis="compact"
        />
        <span className="text-[14px] font-medium text-text-primary">{teamName(code)}</span>
        <span className="typo-small text-text-muted">{code}</span>
      </div>
    );
  }

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

      {/* MODO BÚSQUEDA: resultados globales agrupados por equipo */}
      {isSearching ? (
        searchGroups.length === 0 ? (
          <p className="text-[14px] text-text-muted text-center py-4 m-0">{emptyMessage}</p>
        ) : (
          <div className="grid gap-3">
            {searchGroups.map(([code, players]) => (
              <div key={code} className="grid gap-1.5">
                <TeamHeader code={code} />
                <ul className="grid gap-1 m-0 p-0 list-none" role="listbox" aria-label={`Jugadores de ${teamName(code)}`}>
                  {players.map((player) => (
                    <PlayerRow key={player.playerId} player={player} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      ) : selectedTeam ? (
        /* MODO EQUIPO: un solo equipo expandido con sus jugadores */
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setSelectedTeam(null)}
            className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary cursor-pointer w-fit"
          >
            <span aria-hidden>←</span> Todas las selecciones
          </button>
          <TeamHeader code={selectedTeam} />
          <ul className="grid gap-1 m-0 p-0 list-none" role="listbox" aria-label={`Jugadores de ${teamName(selectedTeam)}`}>
            {sortPlayers(byTeam.get(selectedTeam) ?? []).map((player) => (
              <PlayerRow key={player.playerId} player={player} />
            ))}
          </ul>
        </div>
      ) : (
        /* MODO SELECTOR: grilla de las 48 selecciones */
        <div className="grid gap-2">
          <p className="text-[13px] text-text-muted m-0">Elegí una selección o buscá un jugador por nombre.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {teamCodes.map((code) => {
              const identity = resolveTeamIdentity(code);
              const count = byTeam.get(code)?.length ?? 0;
              const allOut = teamAllDisabled(code);
              const hasPick = (byTeam.get(code) ?? []).some((p) => p.playerId === selectedPlayerId);
              return (
                <button
                  key={code}
                  type="button"
                  disabled={allOut}
                  onClick={() => setSelectedTeam(code)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 border transition-colors text-left ${
                    allOut
                      ? "border-border-subtle bg-surface-default opacity-40 cursor-not-allowed"
                      : hasPick
                        ? "border-accent-primary bg-accent-primary/10 ring-1 ring-accent-primary/30 cursor-pointer"
                        : "border-border-subtle bg-surface-default hover:bg-surface-raised cursor-pointer"
                  }`}
                >
                  <TeamIdentity
                    team={{ teamName: teamName(code), fifaCode: identity.fifaCode, flagAsset: identity.flagAsset, flagUrl: identity.flagUrl }}
                    size="sm"
                    showFlag
                    showName={false}
                    emphasis="compact"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-text-primary truncate">{teamName(code)}</span>
                    <span className="text-[11px] text-text-muted">
                      {hasPick ? "✓ tu elección" : allOut && disabledHint ? disabledHint : `${count} jugadores`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
