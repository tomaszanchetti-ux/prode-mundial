export const MACRO_GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const MACRO_PICKS_STATUSES = [
  "not_started",
  "draft_editable",
  "submitted_editable",
  "locked_original",
  "adjustment_available",
  "adjusted_locked",
  "fully_scored"
] as const;

export const MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL = {
  finalistPoints: 5,
  championPoints: 12
} as const;

export const MACRO_SCORING_RULES = {
  groupPositionExactPoints: 10,
  groupQualifiedWrongOrderPoints: 5,
  finalistPoints: 10,
  championPoints: 25,
  adjustedFinalistPoints: MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL.finalistPoints,
  adjustedChampionPoints: MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL.championPoints
} as const;
