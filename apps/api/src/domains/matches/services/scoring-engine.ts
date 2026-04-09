import { MATCH_SCORING_RULES } from "@prode/shared";
import type { StoredMatch, StoredPredictionScoringBreakdown } from "../types";

function resolveOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) {
    return "draw";
  }

  return homeScore > awayScore ? "home" : "away";
}

function isKnockoutMatch(match: StoredMatch) {
  return match.stage !== "group";
}

export function scorePrediction(match: StoredMatch, prediction: { homeScorePred: number; awayScorePred: number; predictedQualifierTeamId?: string | null }) {
  if (match.homeScore90 === null || match.awayScore90 === null) {
    throw new Error(`Cannot score match ${match.matchId} without an official 90 minute result.`);
  }

  const exact90Points =
    prediction.homeScorePred === match.homeScore90 && prediction.awayScorePred === match.awayScore90
      ? MATCH_SCORING_RULES.exact90Points
      : 0;
  const outcome90Points =
    resolveOutcome(prediction.homeScorePred, prediction.awayScorePred) === resolveOutcome(match.homeScore90, match.awayScore90)
      ? MATCH_SCORING_RULES.correctOutcome90Points
      : 0;
  const qualifierPoints =
    isKnockoutMatch(match) &&
    match.winnerTeamId &&
    prediction.predictedQualifierTeamId &&
    prediction.predictedQualifierTeamId === match.winnerTeamId
      ? MATCH_SCORING_RULES.correctQualifierPoints
      : 0;

  return {
    exact90Points,
    outcome90Points,
    qualifierPoints,
    totalPoints: exact90Points + outcome90Points + qualifierPoints
  } satisfies StoredPredictionScoringBreakdown;
}
