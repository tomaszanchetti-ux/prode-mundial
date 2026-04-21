import { z } from "zod";

export const championScoringBreakdownSchema = z.object({
  championPoints: z.number().int().nonnegative(),
  wasAdjusted: z.boolean()
});

export const championScoringLogSchema = z.object({
  userId: z.string().trim().min(1),
  tournamentId: z.string().trim().min(1),
  totalPoints: z.number().int().nonnegative(),
  breakdown: championScoringBreakdownSchema,
  scoredAt: z.string().trim().min(1)
});
