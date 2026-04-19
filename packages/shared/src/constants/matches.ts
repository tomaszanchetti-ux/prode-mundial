export const MATCH_STAGES = ["group", "R32", "R16", "QF", "SF", "BRONZE", "FINAL"] as const;

export const MATCH_STATUSES = ["scheduled", "live", "finished"] as const;

export const PREDICTION_STATUSES = ["empty", "saved_editable", "locked_unscored", "scored", "void"] as const;

export const MATCH_LIST_FILTERS = ["all", "today", "upcoming", "pending", "scored", "finished"] as const;

export const PREDICTION_LOCK_MINUTES_BEFORE_KICKOFF = 60 as const;

export const MATCH_SCORING_RULES = {
  exact90Points: 4,
  correctOutcome90Points: 2,
  correctQualifierPoints: 2
} as const;

export const MATCH_PREDICTION_ERROR_CODES = [
  "MATCH_LOCKED",
  "PHASE_LOCKED",
  "MATCH_NOT_FOUND",
  "MATCH_NOT_EDITABLE",
  "INVALID_SCORE",
  "INVALID_KNOCKOUT_CLASSIFIER"
] as const;
