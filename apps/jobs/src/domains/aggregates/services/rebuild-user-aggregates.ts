import { aggregatesChampionScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { aggregatesPredictionsRepository } from "../repositories/predictions-repository";
import { aggregatesUsersRepository } from "../repositories/users-repository";

export async function rebuildUserAggregates(userId: string) {
  const [profile, predictions, macroScoringLogs] = await Promise.all([
    aggregatesUsersRepository.findByUserId(userId),
    aggregatesPredictionsRepository.listPredictionsByUser(userId),
    aggregatesChampionScoringLogsRepository.listByUserId(userId)
  ]);

  if (!profile) {
    return null;
  }

  const matchTotals = predictions.reduce(
    (acc, prediction) => {
      if (!prediction.isScored || !prediction.scoringBreakdown) {
        return acc;
      }

      acc.totalPoints += prediction.pointsAwarded;
      acc.exactHits += prediction.scoringBreakdown.exact90Points > 0 ? 1 : 0;
      acc.correctSigns += prediction.scoringBreakdown.outcome90Points > 0 ? 1 : 0;
      return acc;
    },
    { totalPoints: 0, exactHits: 0, correctSigns: 0 }
  );

  const macroPoints = macroScoringLogs.reduce((total, log) => total + log.totalPoints, 0);

  const nextProfile = {
    ...profile,
    totalPoints: matchTotals.totalPoints + macroPoints,
    macroPoints,
    exactHits: matchTotals.exactHits,
    correctSigns: matchTotals.correctSigns
  };

  await aggregatesUsersRepository.upsertProfile(nextProfile);
  return nextProfile;
}
