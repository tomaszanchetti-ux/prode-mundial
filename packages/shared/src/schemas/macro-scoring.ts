import { z } from "zod";
import { MACRO_SCORING_RULES } from "../constants/macro-picks";

export const macroScoringRulesSchema = z.object({
  groupPositionExactPoints: z.literal(MACRO_SCORING_RULES.groupPositionExactPoints),
  groupQualifiedWrongOrderPoints: z.literal(MACRO_SCORING_RULES.groupQualifiedWrongOrderPoints),
  finalistPoints: z.literal(MACRO_SCORING_RULES.finalistPoints),
  championPoints: z.literal(MACRO_SCORING_RULES.championPoints),
  adjustedFinalistPoints: z.literal(MACRO_SCORING_RULES.adjustedFinalistPoints),
  adjustedChampionPoints: z.literal(MACRO_SCORING_RULES.adjustedChampionPoints)
});

export const macroScoringBreakdownSchema = z.object({
  groupPoints: z.number().int().nonnegative(),
  finalistsPoints: z.number().int().nonnegative(),
  championPoints: z.number().int().nonnegative(),
  adjustmentPenaltyApplied: z.boolean(),
  totalPoints: z.number().int().nonnegative()
});

export const macroScoringLogSchema = z.object({
  userId: z.string().trim().min(1),
  tournamentId: z.string().trim().min(1),
  totalPoints: z.number().int().nonnegative(),
  breakdown: macroScoringBreakdownSchema,
  isAdjusted: z.boolean(),
  createdAt: z.string().trim().min(1)
});
