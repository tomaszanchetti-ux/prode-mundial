import { z } from "zod";
import { matchPredictionScoringBreakdownSchema } from "./matches";

export const userPointsSummarySchema = z.object({
  totalPoints: z.number().int().nonnegative(),
  macroPoints: z.number().int().nonnegative(),
  exactHits: z.number().int().nonnegative(),
  correctSigns: z.number().int().nonnegative()
});

export const userPointsTotalsSchema = userPointsSummarySchema.extend({
  matchPoints: z.number().int().nonnegative()
});

export const pointsByStageSchema = z.object({
  group: z.number().int().nonnegative(),
  R32: z.number().int().nonnegative(),
  R16: z.number().int().nonnegative(),
  QF: z.number().int().nonnegative(),
  SF: z.number().int().nonnegative(),
  BRONZE: z.number().int().nonnegative(),
  FINAL: z.number().int().nonnegative(),
  macro: z.number().int().nonnegative()
});

export const recentPointsEntrySchema = z.object({
  matchId: z.string().min(1),
  matchLabel: z.string().min(1),
  stageLabel: z.string().min(1),
  userPredictionSummary: z.string().min(1),
  officialResultSummary: z.string().min(1),
  points: z.number().int().nonnegative(),
  scoredAt: z.string().datetime(),
  breakdown: matchPredictionScoringBreakdownSchema
});

export const pointsResponseSchema = userPointsSummarySchema.extend({
  matchPoints: z.number().int().nonnegative(),
  totals: userPointsTotalsSchema,
  byStage: pointsByStageSchema,
  recentMatches: z.array(recentPointsEntrySchema)
});
