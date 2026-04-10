import type { PreTournamentSummary } from "@prode/shared";
import { getPredictionOpensAt } from "../../matches/services/match-state";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import type { StoredMatch } from "../../matches/types";

function toCompletionPercentage(completedMatches: number, totalMatches: number) {
  if (totalMatches === 0) {
    return 0;
  }

  return Math.round((completedMatches / totalMatches) * 100);
}

function resolveIsPreTournament(matches: StoredMatch[], now: Date) {
  const firstMatch = matches[0];

  if (!firstMatch) {
    return false;
  }

  return now.getTime() < getPredictionOpensAt(firstMatch).getTime();
}

export class PreTournamentSummaryService {
  async getSummaryForUser(userId: string, now = new Date()): Promise<PreTournamentSummary> {
    const [allMatches, groupMatches] = await Promise.all([
      matchesRepository.listMatches(),
      matchesRepository.listMatches({ stage: "group" })
    ]);
    const predictionsByMatchId = await predictionsRepository.listPredictionsByUserForMatches(
      userId,
      groupMatches.map((match) => match.matchId)
    );

    const completedMatches = groupMatches.filter((match) => predictionsByMatchId.has(match.matchId)).length;
    const totalMatches = groupMatches.length;
    const remainingMatches = Math.max(totalMatches - completedMatches, 0);
    const nextPendingMatch =
      groupMatches.find((match) => !predictionsByMatchId.has(match.matchId)) ?? null;

    return {
      isPreTournament: resolveIsPreTournament(allMatches, now),
      completedMatches,
      totalMatches,
      remainingMatches,
      completionPercentage: toCompletionPercentage(completedMatches, totalMatches),
      nextPendingMatchId: nextPendingMatch?.matchId ?? null
    };
  }
}

export const preTournamentSummaryService = new PreTournamentSummaryService();
