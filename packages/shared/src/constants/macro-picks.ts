export const CHAMPION_SCORING_RULES = {
  originalCorrectPoints: 20,
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

// ── Balón de Oro (EPIC 19) ─────────────────────────────
// Mirror exacto de la estructura Campeón/Sub-Campeón. Mismas ventanas A/B,
// mismas reglas de scoring (25 / 10). El pick target es un playerId del
// mock roster (`BEST_PLAYER_ROSTER`); backend real post-15/05 reemplaza el
// roster sin tocar infra.

export const BEST_PLAYER_SCORING_RULES = {
  originalCorrectPoints: 20,
  adjustedCorrectPoints: 10,
} as const;

export const BEST_PLAYER_PICK_STATUSES = CHAMPION_PICK_STATUSES;

export type BestPlayerPickStatus = ChampionPickStatus;
