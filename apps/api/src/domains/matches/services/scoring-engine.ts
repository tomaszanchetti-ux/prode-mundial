import { MATCH_SCORING_RULES } from "@prode/shared";
import type { StoredMatch, StoredPredictionScoringBreakdown } from "../types";

function resolveOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) {
    return "draw";
  }

  return homeScore > awayScore ? "home" : "away";
}

/**
 * Scoring exclusivo (EPIC 24 + bonus penales):
 *   - Marcador exacto al 90' → exact90Points
 *   - Solo resultado W/L/D al 90' → correctOutcome90Points
 *   - Ninguno → 0
 *
 * Bonus penales (solo knockouts): si el partido termina empate al 90' y se define
 * por penales, y el user predijo empate Y acertó qué equipo clasifica
 * (advancesTeamPred === winnerTeamId) → penaltyWinnerPoints adicionales.
 * Se acumula al exact/outcome del 90'.
 */
export function scorePrediction(
  match: StoredMatch,
  prediction: { homeScorePred: number; awayScorePred: number; advancesTeamPred?: string | null }
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

  const isKnockout = match.stage !== "group";
  const matchDrew90 = match.homeScore90 === match.awayScore90;
  const predictedDraw = prediction.homeScorePred === prediction.awayScorePred;
  const advanceHit =
    Boolean(prediction.advancesTeamPred) && prediction.advancesTeamPred === match.winnerTeamId;
  const penaltyBonusPoints =
    isKnockout && matchDrew90 && predictedDraw && advanceHit ? MATCH_SCORING_RULES.penaltyWinnerPoints : 0;

  return {
    exact90Points,
    outcome90Points,
    penaltyBonusPoints,
    totalPoints: exact90Points + outcome90Points + penaltyBonusPoints
  };
}
