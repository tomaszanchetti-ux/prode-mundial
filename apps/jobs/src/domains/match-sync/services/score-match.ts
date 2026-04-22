/**
 * Scoring ligero para el job de sync.
 * Replica la lógica de apps/api scoring-engine + score-match,
 * pero solo con dependencias de Firestore (sin Express/ApiError).
 */

import { MATCH_SCORING_RULES } from "@prode/shared";
import { matchSyncMatchesRepository } from "../repositories/matches-repository";
import { matchSyncPredictionsRepository } from "../repositories/predictions-repository";
import type { SyncStoredMatch, SyncStoredPrediction } from "../types";

function resolveOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

function scorePrediction(match: SyncStoredMatch, prediction: SyncStoredPrediction) {
  const homeScore = match.homeScore90!;
  const awayScore = match.awayScore90!;

  const isExact =
    prediction.homeScorePred === homeScore && prediction.awayScorePred === awayScore;
  const isCorrectOutcome =
    resolveOutcome(prediction.homeScorePred, prediction.awayScorePred) === resolveOutcome(homeScore, awayScore);

  const exact90Points = isExact ? MATCH_SCORING_RULES.exact90Points : 0;
  const outcome90Points = !isExact && isCorrectOutcome ? MATCH_SCORING_RULES.correctOutcome90Points : 0;

  return {
    exact90Points,
    outcome90Points,
    totalPoints: exact90Points + outcome90Points
  };
}

export type ScoreMatchResult = {
  scoredCount: number;
  affectedUserIds: string[];
};

/**
 * Score all predictions for a finished match.
 * Returns count of predictions scored + userIds whose totals need rebuild.
 */
export async function scoreMatchPredictions(
  match: SyncStoredMatch,
  nowIso: string
): Promise<ScoreMatchResult> {
  if (match.homeScore90 === null || match.awayScore90 === null) {
    throw new Error(`Cannot score match ${match.matchId} without official scores.`);
  }

  const predictions = await matchSyncPredictionsRepository.listPredictionsByMatch(match.matchId);
  const scoredUserIds: string[] = [];

  for (const prediction of predictions) {
    if (prediction.isScored) continue;

    const breakdown = scorePrediction(match, prediction);

    await matchSyncPredictionsRepository.updatePrediction(prediction.predictionId, {
      isLocked: true,
      isScored: true,
      pointsAwarded: breakdown.totalPoints,
      scoringBreakdown: breakdown,
      scoredAt: nowIso,
      updatedAt: nowIso
    });

    scoredUserIds.push(prediction.userId);
  }

  await matchSyncMatchesRepository.updateMatch(match.matchId, {
    isScored: true,
    updatedAt: nowIso
  });

  return {
    scoredCount: scoredUserIds.length,
    affectedUserIds: [...new Set(scoredUserIds)]
  };
}
