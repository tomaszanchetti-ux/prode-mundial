import { resolveOfficialFinalResults } from "@prode/shared";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import { bestPlayerPicksRepository } from "../repositories/best-player-picks-repository";
import {
  bestPlayerResultsRepository,
  championResultsRepository,
  subChampionResultsRepository
} from "../repositories/macro-results-repository";
import { championPicksRepository } from "../repositories/macro-picks-repository";
import { championScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { subChampionPicksRepository } from "../repositories/sub-champion-picks-repository";
import type {
  StoredBestPlayerPick,
  StoredChampionPick,
  StoredChampionScoringLog,
  StoredSubChampionPick
} from "../types";
import { scoreBestPlayerPick, scoreChampionPick, scoreSubChampionPick } from "./macro-scoring-engine";

// ── Official result resolution ──────────────────────────
//
// Prioridad para Campeón/Sub-Campeón:
//   1. Value pasado explícitamente al batch (test-only / override manual).
//   2. Resultado persistido en Firestore (legacy path con upsert-macro-results).
//   3. Auto-derive desde el match Final (EPIC 19 Card 6 — default prod path).
//
// Balón de Oro: NO se auto-deriva (FIFA lo anuncia días después). Se lee
// únicamente del repo `bestPlayerResults` (script manual
// `upsert-best-player-result` + data manual de FIFA oficial).

type OfficialResults = {
  championTeamId: string | null;
  subChampionTeamId: string | null;
  bestPlayerId: string | null;
};

async function loadOfficialResults(
  tournamentId: string,
  overrides: { champion?: string; subChampion?: string; bestPlayer?: string },
  nowIso: string
): Promise<OfficialResults> {
  let championTeamId: string | null = overrides.champion ?? null;
  let subChampionTeamId: string | null = overrides.subChampion ?? null;
  const bestPlayerId: string | null = overrides.bestPlayer ?? null;

  if (!championTeamId) {
    const stored = await championResultsRepository.getByTournamentId(tournamentId);
    championTeamId = stored?.championTeamId ?? null;
  }

  if (!subChampionTeamId) {
    const stored = await subChampionResultsRepository.getByTournamentId(tournamentId);
    subChampionTeamId = stored?.subChampionTeamId ?? null;
  }

  // Auto-derive desde la Final si todavía falta algo. Si se resuelve,
  // persistimos en Firestore para que queden disponibles (vista read-only,
  // debugging, rebuilds posteriores).
  if (!championTeamId || !subChampionTeamId) {
    const matches = await matchesRepository.listMatches();
    const derived = resolveOfficialFinalResults(
      matches.map((m) => ({
        stage: m.stage,
        status: m.status,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        winnerTeamId: m.winnerTeamId
      }))
    );

    if (derived) {
      if (!championTeamId) {
        championTeamId = derived.championTeamId;
        await championResultsRepository.upsert({
          tournamentId,
          championTeamId: derived.championTeamId,
          updatedAt: nowIso
        });
      }
      if (!subChampionTeamId) {
        subChampionTeamId = derived.subChampionTeamId;
        await subChampionResultsRepository.upsert({
          tournamentId,
          subChampionTeamId: derived.subChampionTeamId,
          updatedAt: nowIso
        });
      }
    }
  }

  let resolvedBestPlayerId = bestPlayerId;
  if (!resolvedBestPlayerId) {
    const stored = await bestPlayerResultsRepository.getByTournamentId(tournamentId);
    resolvedBestPlayerId = stored?.bestPlayerId ?? null;
  }

  return {
    championTeamId,
    subChampionTeamId,
    bestPlayerId: resolvedBestPlayerId
  };
}

// ── Log merge — 1 doc por user+tournament con 3 componentes ─────

async function mergeScoringLog(
  userId: string,
  tournamentId: string,
  delta: Partial<Pick<StoredChampionScoringLog, "championPoints" | "subChampionPoints" | "bestPlayerPoints" | "wasAdjusted">>,
  nowIso: string
): Promise<void> {
  const existing = await championScoringLogsRepository.getByUserIdAndTournamentId(userId, tournamentId);

  const championPoints = delta.championPoints ?? existing?.championPoints ?? 0;
  const subChampionPoints = delta.subChampionPoints ?? existing?.subChampionPoints ?? 0;
  const bestPlayerPoints = delta.bestPlayerPoints ?? existing?.bestPlayerPoints ?? 0;
  const totalPoints = championPoints + subChampionPoints + bestPlayerPoints;

  // wasAdjusted marca si CUALQUIERA de los 3 picks fue ajustado. Hoy lo
  // preservamos para compatibilidad con lecturas existentes — la UI
  // consume cada punto por separado de los picks service, no de este log.
  const wasAdjusted = delta.wasAdjusted ?? existing?.wasAdjusted ?? false;

  await championScoringLogsRepository.upsert({
    userId,
    tournamentId,
    totalPoints,
    championPoints,
    subChampionPoints,
    bestPlayerPoints,
    wasAdjusted,
    scoredAt: nowIso
  });
}

// ── Picks scoring ───────────────────────────────────────

async function scoreChampionPicks(
  tournamentId: string,
  officialChampion: string,
  nowIso: string
): Promise<StoredChampionPick[]> {
  const picks = await championPicksRepository.listAll();
  const withPick = picks.filter((pick) => pick.championTeamId !== null);

  for (const pick of withPick) {
    const breakdown = scoreChampionPick(pick, officialChampion);
    await mergeScoringLog(
      pick.userId,
      tournamentId,
      { championPoints: breakdown.championPoints, wasAdjusted: breakdown.wasAdjusted },
      nowIso
    );
  }

  return withPick;
}

async function scoreSubChampionPicks(
  tournamentId: string,
  officialSubChampion: string,
  nowIso: string
): Promise<StoredSubChampionPick[]> {
  const picks = await subChampionPicksRepository.listAll();
  const withPick = picks.filter((pick) => pick.subChampionTeamId !== null);

  for (const pick of withPick) {
    const breakdown = scoreSubChampionPick(pick, officialSubChampion);
    await mergeScoringLog(
      pick.userId,
      tournamentId,
      { subChampionPoints: breakdown.subChampionPoints },
      nowIso
    );
  }

  return withPick;
}

async function scoreBestPlayerPicks(
  tournamentId: string,
  officialBestPlayerId: string,
  nowIso: string
): Promise<StoredBestPlayerPick[]> {
  const picks = await bestPlayerPicksRepository.listAll();
  const withPick = picks.filter((pick) => pick.bestPlayerId !== null);

  for (const pick of withPick) {
    const breakdown = scoreBestPlayerPick(pick, officialBestPlayerId);
    await mergeScoringLog(
      pick.userId,
      tournamentId,
      { bestPlayerPoints: breakdown.bestPlayerPoints },
      nowIso
    );
  }

  return withPick;
}

// ── User / league aggregates ────────────────────────────

async function rebuildAffectedUsersAndLeagues(userIds: string[], nowIso: string): Promise<number> {
  const affectedLeagueIds = new Set<string>();

  for (const userId of userIds) {
    await rebuildUserAggregates(userId);
    const memberships = await leagueMembersRepository.listMembershipsByUser(userId);

    for (const membership of memberships) {
      affectedLeagueIds.add(membership.leagueId);
    }
  }

  await Promise.all([...affectedLeagueIds].map((leagueId) => rebuildLeagueStandings(leagueId, nowIso)));

  return affectedLeagueIds.size;
}

// ── Public API ──────────────────────────────────────────

export type ScoreMacroBatchInput = {
  championOverride?: string;
  subChampionOverride?: string;
  bestPlayerOverride?: string;
};

export type ScoreMacroBatchSummary = {
  tournamentId: string;
  usersProcessed: number;
  championScored: number;
  subChampionScored: number;
  bestPlayerScored: number;
  affectedLeagues: number;
  missing: {
    champion: boolean;
    subChampion: boolean;
    bestPlayer: boolean;
  };
};

export async function scoreMacroBatch(
  tournamentId: string,
  input: ScoreMacroBatchInput | string = {},
  nowIso = new Date().toISOString()
): Promise<ScoreMacroBatchSummary> {
  // Backwards-compat: antes firma era `scoreMacroBatch(tournamentId, championOverride?)`.
  // Aceptamos string como override del champion para no romper callers existentes.
  const overrides: ScoreMacroBatchInput =
    typeof input === "string" ? { championOverride: input } : input;

  const official = await loadOfficialResults(
    tournamentId,
    {
      champion: overrides.championOverride,
      subChampion: overrides.subChampionOverride,
      bestPlayer: overrides.bestPlayerOverride
    },
    nowIso
  );

  const affectedUserIds = new Set<string>();

  const championScoredPicks = official.championTeamId
    ? await scoreChampionPicks(tournamentId, official.championTeamId, nowIso)
    : [];
  for (const pick of championScoredPicks) affectedUserIds.add(pick.userId);

  const subChampionScoredPicks = official.subChampionTeamId
    ? await scoreSubChampionPicks(tournamentId, official.subChampionTeamId, nowIso)
    : [];
  for (const pick of subChampionScoredPicks) affectedUserIds.add(pick.userId);

  const bestPlayerScoredPicks = official.bestPlayerId
    ? await scoreBestPlayerPicks(tournamentId, official.bestPlayerId, nowIso)
    : [];
  for (const pick of bestPlayerScoredPicks) affectedUserIds.add(pick.userId);

  const affectedLeagues = await rebuildAffectedUsersAndLeagues([...affectedUserIds], nowIso);

  return {
    tournamentId,
    usersProcessed: affectedUserIds.size,
    championScored: championScoredPicks.length,
    subChampionScored: subChampionScoredPicks.length,
    bestPlayerScored: bestPlayerScoredPicks.length,
    affectedLeagues,
    missing: {
      champion: !official.championTeamId,
      subChampion: !official.subChampionTeamId,
      bestPlayer: !official.bestPlayerId
    }
  };
}

export type RebuildMacroScoringSummary = ScoreMacroBatchSummary & {
  clearedLogs: number;
};

export async function rebuildMacroScoring(
  tournamentId: string,
  input: ScoreMacroBatchInput | string = {},
  nowIso = new Date().toISOString()
): Promise<RebuildMacroScoringSummary> {
  const existingLogs = await championScoringLogsRepository.listByTournamentId(tournamentId);
  await championScoringLogsRepository.deleteByTournamentId(tournamentId);

  const summary = await scoreMacroBatch(tournamentId, input, nowIso);

  // Incluir users que tenían log previo pero ya no tienen pick — rebuild
  // necesita recomputar sus aggregates.
  const carryOverUsers = new Set(existingLogs.map((log) => log.userId));
  for (const userId of carryOverUsers) {
    await rebuildUserAggregates(userId);
  }

  return {
    ...summary,
    clearedLogs: existingLogs.length
  };
}
