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

  // Knock-out empates: football-data puede publicar primero el 1-1 a los 90' y
  // recién después score.winner (penales). Sin esto el sync no persiste
  // winnerTeamId y la ronda R32 nunca cierra para hidratar 8vos.
  if (newStatus === "finished") {
    const nextWinner = resolveWinnerTeamId(internal, external, newStatus);
    if (nextWinner !== internal.winnerTeamId) return true;
  }

  return false;
}

/**
 * Decide qué hacer con un match interno ya emparejado con su par externo.
 * Pura: no toca Firestore.
 *
 *  - `admin-manual` → `skip` siempre: una corrección manual del admin manda,
 *    el feed nunca la pisa.
 *  - ya puntuado + feed sin cambios → `skip` (caso normal en cada corrida).
 *  - ya puntuado + feed CAMBIÓ y sigue FINISHED → `process` con `rescore: true`:
 *    la fuente corrigió un resultado post-final, hay que re-puntuar desde cero.
 *  - ya puntuado + feed revierte a live/scheduled → `skip`: no tocamos una fila
 *    final ya puntuada (football-data a veces marca FINISHED prematuro y lo
 *    revierte a IN_PLAY; pisarla la corrompería sin re-puntuar).
 *  - sin puntuar → `process` si hay update, o si quedó finished sin puntuar
 *    (retry de scoring tras una falla a mitad de camino).
 */
export type SyncDecision = {
  action: "skip" | "process";
  rescore: boolean;
  hasUpdate: boolean;
};

export function decideSyncAction(
  internal: SyncStoredMatch,
  external: FootballDataMatch
): SyncDecision {
  const hasUpdate = needsUpdate(internal, external);
  const skip: SyncDecision = { action: "skip", rescore: false, hasUpdate };

  // Override humano manda: el feed nunca pisa una corrección manual del admin.
  if (internal.sourceProvider === "admin-manual") return skip;

  const mappedStatus = mapExternalStatus(external.status);

  if (internal.isScored) {
    // Solo re-procesamos una corrección que SIGUE siendo final. Si el feed
    // revierte a live/scheduled, dejamos intacto lo ya puntuado.
    const isCorrection = hasUpdate && mappedStatus === "finished";
    return isCorrection ? { action: "process", rescore: true, hasUpdate } : skip;
  }

  // Sin puntuar: update normal, o retry de scoring si quedó finished sin puntuar.
  const needsScoringRetry =
    !hasUpdate && mappedStatus === "finished" && internal.status === "finished";

  if (!hasUpdate && !needsScoringRetry) return skip;

  return { action: "process", rescore: false, hasUpdate };
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
