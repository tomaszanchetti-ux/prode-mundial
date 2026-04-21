/**
 * MatchSyncService — sincroniza resultados desde football-data.org → Firestore → scoring pipeline
 *
 * Flujo:
 *   1. Fetch matches LIVE + FINISHED desde football-data.org
 *   2. Para cada match externo, buscar match interno por officialMatchNumber o equipos
 *   3. Si hay cambios (status, scores), actualizar Firestore
 *   4. Si un match pasó a "finished" y no está scored, disparar scoreMatch()
 */

import { matchesRepository } from "../repositories/matches-repository";
import type { StoredMatch } from "../types";
import { scoreMatch } from "./score-match";
import {
  fetchSyncableMatches,
  mapExternalStatus,
  mapTeamTla,
  type FootballDataMatch
} from "./football-data-client";

export type MatchSyncResult = {
  syncedAt: string;
  externalMatchesFetched: number;
  matchesUpdated: number;
  matchesScored: number;
  skipped: SkippedMatch[];
  errors: SyncError[];
};

type SkippedMatch = {
  externalId: number;
  reason: string;
};

type SyncError = {
  matchId: string;
  error: string;
};

/**
 * Busca el match interno que corresponde al match externo.
 * Estrategia: matchear por equipos (homeTeamId + awayTeamId).
 * Los TLA de football-data.org coinciden con nuestros teamIds (códigos FIFA).
 */
function findInternalMatch(
  externalMatch: FootballDataMatch,
  internalMatches: StoredMatch[]
): StoredMatch | null {
  const extHome = mapTeamTla(externalMatch.homeTeam.tla);
  const extAway = mapTeamTla(externalMatch.awayTeam.tla);

  return internalMatches.find(
    (m) => m.homeTeamId === extHome && m.awayTeamId === extAway
  ) ?? null;
}

/** Determina si el match interno necesita actualización. */
function needsUpdate(
  internal: StoredMatch,
  external: FootballDataMatch
): boolean {
  const newStatus = mapExternalStatus(external.status);

  if (!newStatus) return false;

  // Status cambió
  if (internal.status !== newStatus) return true;

  // Scores cambiaron (match en vivo, scores parciales)
  const extHome = external.score.fullTime.home;
  const extAway = external.score.fullTime.away;

  if (extHome !== null && extHome !== internal.homeScore90) return true;
  if (extAway !== null && extAway !== internal.awayScore90) return true;

  return false;
}

/** Aplica los datos externos al match interno y persiste. */
async function applyUpdate(
  internal: StoredMatch,
  external: FootballDataMatch,
  nowIso: string
): Promise<StoredMatch> {
  const newStatus = mapExternalStatus(external.status)!;
  const extHome = external.score.fullTime.home;
  const extAway = external.score.fullTime.away;

  const updated: StoredMatch = {
    ...internal,
    status: newStatus,
    homeScore90: extHome,
    awayScore90: extAway,
    isLocked: true, // cualquier match live o finished debe estar locked
    sourceProvider: "football-data.org",
    sourceLastSyncedAt: nowIso,
    updatedAt: nowIso
  };

  // Para knockout: determinar winnerTeamId si el match terminó
  if (newStatus === "finished" && extHome !== null && extAway !== null) {
    if (extHome > extAway) {
      updated.winnerTeamId = internal.homeTeamId;
    } else if (extAway > extHome) {
      updated.winnerTeamId = internal.awayTeamId;
    }
    // Si empate en knockout, winnerTeamId se resuelve por penales
    // football-data.org lo indica en score.winner
    if (extHome === extAway && external.score.winner) {
      if (external.score.winner === "HOME_TEAM") {
        updated.winnerTeamId = internal.homeTeamId;
      } else if (external.score.winner === "AWAY_TEAM") {
        updated.winnerTeamId = internal.awayTeamId;
      }
    }
  }

  await matchesRepository.upsertMatch(updated);
  return updated;
}

/** Ejecuta el sync completo. Llamado por el job cada 2 minutos. */
export async function runMatchSync(
  nowIso = new Date().toISOString()
): Promise<MatchSyncResult> {
  const result: MatchSyncResult = {
    syncedAt: nowIso,
    externalMatchesFetched: 0,
    matchesUpdated: 0,
    matchesScored: 0,
    skipped: [],
    errors: []
  };

  // 1. Fetch external matches (LIVE + FINISHED)
  const externalMatches = await fetchSyncableMatches();
  result.externalMatchesFetched = externalMatches.length;

  if (externalMatches.length === 0) {
    return result;
  }

  // 2. Cargar todos los matches internos para lookup
  const internalMatches = await matchesRepository.listMatches();

  // 3. Procesar cada match externo
  for (const external of externalMatches) {
    const mappedStatus = mapExternalStatus(external.status);

    if (!mappedStatus) {
      result.skipped.push({
        externalId: external.id,
        reason: `Unhandled status: ${external.status}`
      });
      continue;
    }

    const internal = findInternalMatch(external, internalMatches);

    if (!internal) {
      result.skipped.push({
        externalId: external.id,
        reason: `No internal match found for ${external.homeTeam.tla} vs ${external.awayTeam.tla}`
      });
      continue;
    }

    // Ya scored → no volver a procesar
    if (internal.isScored) {
      continue;
    }

    if (!needsUpdate(internal, external)) {
      continue;
    }

    // 4. Aplicar update
    const updated = await applyUpdate(internal, external, nowIso);
    result.matchesUpdated++;

    // 5. Si pasó a finished → trigger scoring pipeline
    if (updated.status === "finished" && !updated.isScored) {
      try {
        await scoreMatch(updated.matchId, nowIso);
        // Marcar como scored
        await matchesRepository.upsertMatch({
          ...updated,
          isScored: true,
          updatedAt: nowIso
        });
        result.matchesScored++;
      } catch (err) {
        result.errors.push({
          matchId: updated.matchId,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
  }

  return result;
}
