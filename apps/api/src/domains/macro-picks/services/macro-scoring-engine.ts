import { CHAMPION_SCORING_RULES, type ChampionScoringBreakdown } from "@prode/shared";
import type { StoredChampionPick } from "../types";

export function scoreChampionPick(
  pick: StoredChampionPick,
  officialChampion: string
): ChampionScoringBreakdown {
  const activeChampion = pick.isAdjusted ? pick.adjustedChampionTeamId : pick.championTeamId;
  const isCorrect = activeChampion === officialChampion;
  const points = isCorrect
    ? (pick.isAdjusted ? CHAMPION_SCORING_RULES.adjustedCorrectPoints : CHAMPION_SCORING_RULES.originalCorrectPoints)
    : 0;

  return { championPoints: points, wasAdjusted: pick.isAdjusted };
}
