import type { MACRO_SCORING_RULES } from "../constants/macro-picks";

export type MacroScoringRules = typeof MACRO_SCORING_RULES;

export type MacroScoringBreakdown = {
  groupPoints: number;
  finalistsPoints: number;
  championPoints: number;
  adjustmentPenaltyApplied: boolean;
  totalPoints: number;
};

export type MacroScoringLog = {
  userId: string;
  tournamentId: string;
  totalPoints: number;
  breakdown: MacroScoringBreakdown;
  isAdjusted: boolean;
  createdAt: string;
};
