import type { StoredPrediction } from "../types";
import type { ValidatedPredictionInput } from "./prediction-domain";

export type UpsertPredictionInput = ValidatedPredictionInput & {
  userId: string;
  matchId: string;
};

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function buildPredictionId(userId: string, matchId: string) {
  return `pred_${sanitizeIdPart(userId)}_${sanitizeIdPart(matchId)}`;
}

export function createStoredPrediction(input: UpsertPredictionInput, nowIso: string): StoredPrediction {
  return {
    predictionId: buildPredictionId(input.userId, input.matchId),
    userId: input.userId,
    matchId: input.matchId,
    homeScorePred: input.homeScorePred,
    awayScorePred: input.awayScorePred,
    predictedWinnerTeamId: input.predictedQualifierTeamId,
    predictedQualifierTeamId: input.predictedQualifierTeamId,
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    lockedAt: null,
    scoredAt: null
  };
}

export function mergeStoredPrediction(
  existing: StoredPrediction,
  input: ValidatedPredictionInput,
  nowIso: string
): StoredPrediction {
  return {
    ...existing,
    homeScorePred: input.homeScorePred,
    awayScorePred: input.awayScorePred,
    predictedWinnerTeamId: input.predictedQualifierTeamId,
    predictedQualifierTeamId: input.predictedQualifierTeamId,
    updatedAt: nowIso
  };
}
