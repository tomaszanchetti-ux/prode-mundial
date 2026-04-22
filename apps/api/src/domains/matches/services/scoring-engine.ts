import { MATCH_SCORING_RULES } from "@prode/shared";
import type { StoredMatch, StoredPredictionScoringBreakdown } from "../types";

function resolveOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) {
    return "draw";
  }

  return homeScore > awayScore ? "home" : "away";
}

/**
 * Scoring exclusivo (EPIC 24):
 *   - Marcador exacto al 90' → exact90Points
 *   - Solo resultado W/L/D al 90' → correctOutcome90Points
 *   - Ninguno → 0
 *
 * En knockouts solo cuenta el 90'. Si termina empate y se define por penales,
 * la prediction de empate acierta aunque el user no haya indicado quién pasa.
 */
export function scorePrediction(
  match: StoredMatch,
  prediction: { homeScorePred: number; awayScorePred: number }
): StoredPredictionScoringBreakdown {
  if (match.homeScore90 === null || match.awayScore90 === null) {
    throw new Error(`Cannot score match ${match.matchId} without an official 90 minute result.`);
  }

  const isExact =
    prediction.homeScorePred === match.homeScore90 &&
    prediction.awayScorePred === match.awayScore90;
  const isCorrectOutcome =
    resolveOutcome(prediction.homeScorePred, prediction.awayScorePred) ===
    resolveOutcome(match.homeScore90, match.awayScore90);

  const exact90Points = isExact ? MATCH_SCORING_RULES.exact90Points : 0;
  const outcome90Points = !isExact && isCorrectOutcome ? MATCH_SCORING_RULES.correctOutcome90Points : 0;

  return {
    exact90Points,
    outcome90Points,
    totalPoints: exact90Points + outcome90Points
  };
}
