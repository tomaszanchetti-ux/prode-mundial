/**
 * Funciones puras de la lógica de sync — sin dependencias de Firestore.
 * Exportadas para testing.
 */

import { mapExternalStatus, resolveScore90, type FootballDataMatch } from "./football-data-client";
import type { SyncStoredMatch } from "../types";

/**
 * Busca el match interno que corresponde al match externo por equipos.
 * Los TLAs externos llegan ya normalizados a códigos FIFA por el cliente
 * (ver TEAM_CODE_ALIASES en football-data-client).
 */
export function findInternalMatch(
  external: FootballDataMatch,
  internalMatches: SyncStoredMatch[]
): SyncStoredMatch | null {
  const extHome = external.homeTeam.tla;
  const extAway = external.awayTeam.tla;

  return internalMatches.find(
    (m) => m.homeTeamId === extHome && m.awayTeamId === extAway
  ) ?? null;
}

export function needsUpdate(internal: SyncStoredMatch, external: FootballDataMatch): boolean {
  const newStatus = mapExternalStatus(external.status);
  if (!newStatus) return false;

  if (internal.status !== newStatus) return true;

  const score90 = resolveScore90(external);
  if (score90.home !== null && score90.home !== internal.homeScore90) return true;
  if (score90.away !== null && score90.away !== internal.awayScore90) return true;

  return false;
}

export function resolveWinnerTeamId(
  internal: SyncStoredMatch,
  external: FootballDataMatch,
  newStatus: string
): string | null {
  const { home: extHome, away: extAway } = resolveScore90(external);

  if (newStatus !== "finished" || extHome === null || extAway === null) {
    return internal.winnerTeamId;
  }

  if (extHome > extAway) return internal.homeTeamId;
  if (extAway > extHome) return internal.awayTeamId;

  // Empate en 90 min — football-data.org indica ganador por prórroga/penales en score.winner
  if (external.score.winner === "HOME_TEAM") return internal.homeTeamId;
  if (external.score.winner === "AWAY_TEAM") return internal.awayTeamId;

  return null;
}
