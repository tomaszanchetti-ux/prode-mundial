import { z } from "zod";
import { matchPredictionScoringBreakdownSchema } from "./matches";

export const userPointsSummarySchema = z.object({
  totalPoints: z.number().int().nonnegative(),
  macroPoints: z.number().int().nonnegative(),
  exactHits: z.number().int().nonnegative(),
  correctSigns: z.number().int().nonnegative()
});

export const recentPointsEntrySchema = z.object({
  matchId: z.string().min(1),
  matchLabel: z.string().min(1),
  stageLabel: z.string().min(1),
  points: z.number().int().nonnegative(),
  scoredAt: z.string().datetime(),
  breakdown: matchPredictionScoringBreakdownSchema
});

export const pointsResponseSchema = userPointsSummarySchema.extend({
  recentMatches: z.array(recentPointsEntrySchema)
});
