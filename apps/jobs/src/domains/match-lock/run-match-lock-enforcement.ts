import type { MatchLockExecutionSummary } from "./types";
import { matchLockMatchesRepository } from "./repositories/matches-repository";
import { matchLockPredictionsRepository } from "./repositories/predictions-repository";
import { buildMatchLockPlan, shouldLockMatch, summarizeLockPlans } from "./services/match-lock-enforcement";

export async function runMatchLockEnforcement(now = new Date()): Promise<MatchLockExecutionSummary> {
  const nowIso = now.toISOString();
  const pendingMatches = await matchLockMatchesRepository.listMatchesPendingLock(nowIso);
  const plans = [];

  for (const match of pendingMatches) {
    if (!shouldLockMatch(match, now)) {
      continue;
    }

    const predictions = await matchLockPredictionsRepository.listPredictionsByMatch(match.matchId);
    const plan = buildMatchLockPlan(match, predictions, nowIso);

    await matchLockMatchesRepository.lockMatches(plan.matchIds);
    await matchLockPredictionsRepository.lockPredictions(
      plan.predictions.map((prediction) => ({
        predictionId: prediction.predictionId,
        lockedAt: prediction.patch.lockedAt
      }))
    );

    plans.push(plan);
  }

  return summarizeLockPlans(pendingMatches.length, plans);
}
