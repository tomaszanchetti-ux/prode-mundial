import { macroScoringLogsRepository } from "../../macro-picks/repositories/macro-scoring-logs-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import { usersRepository } from "../repositories/users-repository";

export async function rebuildUserAggregates(userId: string) {
  const [profile, predictions, macroScoringLogs] = await Promise.all([
    usersRepository.findByUserId(userId),
    predictionsRepository.listPredictionsByUser(userId),
    macroScoringLogsRepository.listByUserId(userId)
  ]);

  if (!profile) {
    return null;
  }

  const matchTotals = predictions.reduce(
    (accumulator, prediction) => {
      if (!prediction.isScored || !prediction.scoringBreakdown) {
        return accumulator;
      }

      accumulator.totalPoints += prediction.pointsAwarded;
      accumulator.exactHits += prediction.scoringBreakdown.exact90Points > 0 ? 1 : 0;
      accumulator.correctSigns += prediction.scoringBreakdown.outcome90Points > 0 ? 1 : 0;
      return accumulator;
    },
    {
      totalPoints: 0,
      exactHits: 0,
      correctSigns: 0
    }
  );

  const macroPoints = macroScoringLogs.reduce((total, log) => total + log.totalPoints, 0);

  const nextProfile = {
    ...profile,
    totalPoints: matchTotals.totalPoints + macroPoints,
    macroPoints,
    exactHits: matchTotals.exactHits,
    correctSigns: matchTotals.correctSigns
  };

  await usersRepository.upsertProfile(nextProfile);
  return nextProfile;
}
