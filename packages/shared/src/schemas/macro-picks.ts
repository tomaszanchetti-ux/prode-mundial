import { z } from "zod";
import { CHAMPION_PICK_STATUSES } from "../constants/macro-picks";

export const championPickStatusSchema = z.enum(CHAMPION_PICK_STATUSES);

export const championScoringResultSchema = z.object({
  points: z.number().int().nonnegative(),
  wasAdjusted: z.boolean()
});

export const championPickResponseSchema = z.object({
  status: championPickStatusSchema,
  championTeamId: z.string().min(1).nullable(),
  adjustedChampionTeamId: z.string().min(1).nullable(),
  initialDeadlineAt: z.string().min(1).nullable(),
  adjustmentWindowOpensAt: z.string().min(1).nullable(),
  adjustmentWindowClosesAt: z.string().min(1).nullable(),
  isLocked: z.boolean(),
  isAdjustmentWindowOpen: z.boolean(),
  scoringResult: championScoringResultSchema.nullable()
});

export const saveChampionPickInputSchema = z.object({
  championTeamId: z.string().min(1)
});

export const saveChampionPickResponseSchema = z.object({
  ok: z.literal(true),
  status: championPickStatusSchema
});

export const adjustChampionInputSchema = z.object({
  championTeamId: z.string().min(1)
});

export const adjustChampionResponseSchema = z.object({
  ok: z.literal(true),
  status: championPickStatusSchema,
  penaltyNotice: z.string().min(1)
});
