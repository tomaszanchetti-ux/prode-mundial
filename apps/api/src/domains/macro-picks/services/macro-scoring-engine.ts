import { MACRO_SCORING_RULES, type MacroGroupId, type MacroGroupPicks, type MacroScoringBreakdown, type MacroTournamentResults } from "@prode/shared";
import type { StoredMacroPrediction } from "../types";

function getActiveFinalists(prediction: StoredMacroPrediction) {
  if (prediction.isAdjusted && prediction.adjustedFinalists?.length === 2) {
    return prediction.adjustedFinalists;
  }

  return prediction.finalists ?? [];
}

function getActiveChampion(prediction: StoredMacroPrediction) {
  if (prediction.isAdjusted && prediction.adjustedChampion) {
    return prediction.adjustedChampion;
  }

  return prediction.champion;
}

export function scoreGroupPicks(groupPicks: MacroGroupPicks, results: MacroTournamentResults["groups"]) {
  return Object.entries(results).reduce((total, [groupId, result]) => {
    const pick = groupPicks[groupId as MacroGroupId];

    if (!pick) {
      return total;
    }

    let groupPoints = 0;

    if (pick.firstTeamId === result.firstTeamId) {
      groupPoints += MACRO_SCORING_RULES.groupPositionExactPoints;
    } else if (pick.firstTeamId === result.secondTeamId) {
      groupPoints += MACRO_SCORING_RULES.groupQualifiedWrongOrderPoints;
    }

    if (pick.secondTeamId === result.secondTeamId) {
      groupPoints += MACRO_SCORING_RULES.groupPositionExactPoints;
    } else if (pick.secondTeamId === result.firstTeamId) {
      groupPoints += MACRO_SCORING_RULES.groupQualifiedWrongOrderPoints;
    }

    return total + groupPoints;
  }, 0);
}

export function scoreFinalists(finalists: string[], officialFinalists: [string, string], isAdjusted: boolean) {
  const awardedPoints = isAdjusted ? MACRO_SCORING_RULES.adjustedFinalistPoints : MACRO_SCORING_RULES.finalistPoints;
  return finalists.reduce((total, finalist) => total + (officialFinalists.includes(finalist) ? awardedPoints : 0), 0);
}

export function scoreChampion(champion: string | null, officialChampion: string, isAdjusted: boolean) {
  if (!champion || champion !== officialChampion) {
    return 0;
  }

  return isAdjusted ? MACRO_SCORING_RULES.adjustedChampionPoints : MACRO_SCORING_RULES.championPoints;
}

export function applyAdjustmentPenalty(
  prediction: StoredMacroPrediction,
  breakdown: Omit<MacroScoringBreakdown, "adjustmentPenaltyApplied" | "totalPoints">
): MacroScoringBreakdown {
  const totalPoints = breakdown.groupPoints + breakdown.finalistsPoints + breakdown.championPoints;

  return {
    ...breakdown,
    adjustmentPenaltyApplied: prediction.isAdjusted,
    totalPoints
  };
}

export function computeMacroScore(prediction: StoredMacroPrediction, results: MacroTournamentResults): MacroScoringBreakdown {
  const activeFinalists = getActiveFinalists(prediction);
  const activeChampion = getActiveChampion(prediction);

  return applyAdjustmentPenalty(prediction, {
    groupPoints: scoreGroupPicks(prediction.groupPicks, results.groups),
    finalistsPoints: scoreFinalists(activeFinalists, results.finalists, prediction.isAdjusted),
    championPoints: scoreChampion(activeChampion, results.champion, prediction.isAdjusted)
  });
}

export type { MacroTournamentResults };
