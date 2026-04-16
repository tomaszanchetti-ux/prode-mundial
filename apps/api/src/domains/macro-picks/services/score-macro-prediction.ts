import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import type { StoredChampionPick } from "../types";
import { championPicksRepository } from "../repositories/macro-picks-repository";
import { championScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { scoreChampionPick } from "./macro-scoring-engine";

export async function persistChampionScoreForPick(
  pick: StoredChampionPick,
  tournamentId: string,
  officialChampion: string,
  nowIso = new Date().toISOString()
) {
  const breakdown = scoreChampionPick(pick, officialChampion);

  await championScoringLogsRepository.upsert({
    userId: pick.userId,
    tournamentId,
    totalPoints: breakdown.championPoints,
    championPoints: breakdown.championPoints,
    wasAdjusted: breakdown.wasAdjusted,
    scoredAt: nowIso
  });

  return breakdown;
}

export async function scoreChampionPredictionForUser(
  userId: string,
  tournamentId: string,
  officialChampion: string,
  nowIso = new Date().toISOString()
) {
  const pick = await championPicksRepository.getByUserId(userId);

  if (!pick?.championTeamId) {
    throw new ApiError(404, "CHAMPION_PICK_NOT_FOUND", "Champion pick was not found for this user.");
  }

  const breakdown = await persistChampionScoreForPick(pick, tournamentId, officialChampion, nowIso);

  await rebuildUserAggregates(userId);

  const memberships = await leagueMembersRepository.listMembershipsByUser(userId);
  const affectedLeagueIds = [...new Set(memberships.map((membership) => membership.leagueId))];

  await Promise.all(affectedLeagueIds.map((leagueId) => rebuildLeagueStandings(leagueId, nowIso)));

  return {
    userId,
    tournamentId,
    totalPoints: breakdown.championPoints,
    affectedLeagues: affectedLeagueIds.length
  };
}
