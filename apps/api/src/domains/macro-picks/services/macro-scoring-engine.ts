import {
  BEST_PLAYER_SCORING_RULES,
  CHAMPION_SCORING_RULES,
  type BestPlayerScoringBreakdown,
  type ChampionScoringBreakdown,
  type SubChampionScoringBreakdown
} from "@prode/shared";
import type { StoredBestPlayerPick, StoredChampionPick, StoredSubChampionPick } from "../types";

// ── Champion ────────────────────────────────────────────

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

// ── Sub-Champion ────────────────────────────────────────
//
// Reglas de scoring idénticas a Champion (20 pts A / 10 pts B) — EPIC 17.
// Reutilizamos CHAMPION_SCORING_RULES porque son el mismo contrato.

export function scoreSubChampionPick(
  pick: StoredSubChampionPick,
  officialSubChampion: string
): SubChampionScoringBreakdown {
  const active = pick.isAdjusted ? pick.adjustedSubChampionTeamId : pick.subChampionTeamId;
  const isCorrect = active === officialSubChampion;
  const points = isCorrect
    ? (pick.isAdjusted ? CHAMPION_SCORING_RULES.adjustedCorrectPoints : CHAMPION_SCORING_RULES.originalCorrectPoints)
    : 0;

  return { subChampionPoints: points, wasAdjusted: pick.isAdjusted };
}

// ── Best-Player (EPIC 19) ───────────────────────────────

export function scoreBestPlayerPick(
  pick: StoredBestPlayerPick,
  officialBestPlayerId: string
): BestPlayerScoringBreakdown {
  const active = pick.isAdjusted ? pick.adjustedBestPlayerId : pick.bestPlayerId;
  const isCorrect = active === officialBestPlayerId;
  const points = isCorrect
    ? (pick.isAdjusted
        ? BEST_PLAYER_SCORING_RULES.adjustedCorrectPoints
        : BEST_PLAYER_SCORING_RULES.originalCorrectPoints)
    : 0;

  return { bestPlayerPoints: points, wasAdjusted: pick.isAdjusted };
}
