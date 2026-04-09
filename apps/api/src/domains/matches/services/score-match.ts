import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { usersRepository } from "../../users/repositories/users-repository";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import { matchesRepository } from "../repositories/matches-repository";
import { predictionsRepository } from "../repositories/predictions-repository";
import { scorePrediction } from "./scoring-engine";

export async function scoreMatch(matchId: string, nowIso = new Date().toISOString()) {
  const match = await matchesRepository.getMatchById(matchId);

  if (!match) {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Match was not found.");
  }

  if (match.status !== "finished") {
    throw new ApiError(409, "MATCH_LOCKED", "Only finished matches can be scored.");
  }

  const predictions = await predictionsRepository.listPredictionsByMatch(matchId);
  const updatedPredictions = predictions.map((prediction) => {
    const scoringBreakdown = scorePrediction(match, prediction);

    return {
      ...prediction,
      isLocked: true,
      isScored: true,
      pointsAwarded: scoringBreakdown.totalPoints,
      scoringBreakdown,
      scoredAt: nowIso,
      updatedAt: nowIso
    };
  });

  await Promise.all(updatedPredictions.map((prediction) => predictionsRepository.upsertStoredPrediction(prediction)));

  const affectedUserIds = [...new Set(updatedPredictions.map((prediction) => prediction.userId))];
  const affectedLeagueIds = new Set<string>();

  for (const userId of affectedUserIds) {
    const memberships = await leagueMembersRepository.listMembershipsByUser(userId);
    const profile = await rebuildUserAggregates(userId);

    if (profile) {
      await usersRepository.upsertProfile({
        ...profile,
        leaguesCount: memberships.length
      });
    }

    for (const membership of memberships) {
      affectedLeagueIds.add(membership.leagueId);
    }
  }

  await Promise.all([...affectedLeagueIds].map((leagueId) => rebuildLeagueStandings(leagueId, nowIso)));

  return {
    matchId,
    predictionsProcessed: updatedPredictions.length,
    affectedUsers: affectedUserIds.length,
    affectedLeagues: affectedLeagueIds.size
  };
}
