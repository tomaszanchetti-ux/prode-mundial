export const CHAMPION_SCORING_RULES = {
  originalCorrectPoints: 25,
  adjustedCorrectPoints: 10,
} as const;

export const CHAMPION_PICK_STATUSES = [
  "empty",
  "picked",
  "locked",
  "adjustment_available",
  "adjusted",
  "scored",
] as const;

export type ChampionPickStatus = (typeof CHAMPION_PICK_STATUSES)[number];
