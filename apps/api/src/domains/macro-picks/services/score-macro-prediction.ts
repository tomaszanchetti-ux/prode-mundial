import { ApiError } from "../../../server/errors/api-error";
import type { MacroTournamentResults } from "@prode/shared";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import type { StoredMacroPrediction } from "../types";
import { macroPicksRepository } from "../repositories/macro-picks-repository";
import { macroScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { computeMacroScore } from "./macro-scoring-engine";

export async function persistMacroScoreForPrediction(
  prediction: StoredMacroPrediction,
  tournamentId: string,
  results: MacroTournamentResults,
  nowIso = new Date().toISOString()
) {
  const breakdown = computeMacroScore(prediction, results);

  await macroScoringLogsRepository.upsert({
    userId: prediction.userId,
    tournamentId,
    totalPoints: breakdown.totalPoints,
    breakdown,
    isAdjusted: prediction.isAdjusted,
    createdAt: nowIso
  });

  return breakdown;
}

export async function scoreMacroPredictionForUser(
  userId: string,
  tournamentId: string,
  results: MacroTournamentResults,
  nowIso = new Date().toISOString()
) {
  const prediction = await macroPicksRepository.getByUserId(userId);

  if (!prediction?.isSubmitted) {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Submitted macro picks were not found for this user.");
  }

  const breakdown = await persistMacroScoreForPrediction(prediction, tournamentId, results, nowIso);

  await rebuildUserAggregates(userId);

  const memberships = await leagueMembersRepository.listMembershipsByUser(userId);
  const affectedLeagueIds = [...new Set(memberships.map((membership) => membership.leagueId))];

  await Promise.all(affectedLeagueIds.map((leagueId) => rebuildLeagueStandings(leagueId, nowIso)));

  return {
    userId,
    tournamentId,
    totalPoints: breakdown.totalPoints,
    affectedLeagues: affectedLeagueIds.length
  };
}
