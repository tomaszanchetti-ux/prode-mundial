import type { JobStoredMatch, JobStoredPrediction, MatchLockExecutionSummary, MatchLockPlan } from "../types";

export function shouldLockMatch(match: JobStoredMatch, now = new Date()) {
  return match.status === "scheduled" && !match.isLocked && new Date(match.kickoffAt).getTime() <= now.getTime();
}

export function buildMatchLockPlan(
  match: JobStoredMatch,
  predictions: JobStoredPrediction[],
  lockedAtIso: string
): MatchLockPlan {
  return {
    matchIds: [match.matchId],
    matchPatch: {
      isLocked: true
    },
    predictions: predictions
      .filter((prediction) => !prediction.isLocked)
      .map((prediction) => ({
        predictionId: prediction.predictionId,
        patch: {
          isLocked: true,
          lockedAt: prediction.lockedAt ?? lockedAtIso
        }
      }))
  };
}

export function summarizeLockPlans(scannedMatches: number, plans: MatchLockPlan[]): MatchLockExecutionSummary {
  return {
    scannedMatches,
    lockedMatches: plans.reduce((total, plan) => total + plan.matchIds.length, 0),
    lockedPredictions: plans.reduce((total, plan) => total + plan.predictions.length, 0)
  };
}
