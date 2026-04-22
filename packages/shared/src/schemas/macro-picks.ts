import { z } from "zod";
import { CHAMPION_PICK_STATUSES } from "../constants/macro-picks";

export const championPickStatusSchema = z.enum(CHAMPION_PICK_STATUSES);

export const championScoringResultSchema = z.object({
  points: z.number().int().nonnegative(),
  wasAdjusted: z.boolean()
});

export const pickWindowSchema = z.enum(["A", "B", "closed"]);

export const championPickResponseSchema = z.object({
  status: championPickStatusSchema,
  championTeamId: z.string().min(1).nullable(),
  adjustedChampionTeamId: z.string().min(1).nullable(),
  initialDeadlineAt: z.string().min(1).nullable(),
  adjustmentWindowOpensAt: z.string().min(1).nullable(),
  adjustmentWindowClosesAt: z.string().min(1).nullable(),
  isLocked: z.boolean(),
  isAdjustmentWindowOpen: z.boolean(),
  scoringResult: championScoringResultSchema.nullable(),
  pickWindow: pickWindowSchema,
  pickWindowClosesAt: z.string().min(1).nullable(),
  pickWindowPointValue: z.union([z.literal(20), z.literal(10), z.literal(0)])
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

// ── Sub-champion (EPIC 17 — Card 4) ─────────────────────

export const subChampionPickResponseSchema = z.object({
  status: championPickStatusSchema,
  subChampionTeamId: z.string().min(1).nullable(),
  adjustedSubChampionTeamId: z.string().min(1).nullable(),
  initialDeadlineAt: z.string().min(1).nullable(),
  adjustmentWindowOpensAt: z.string().min(1).nullable(),
  adjustmentWindowClosesAt: z.string().min(1).nullable(),
  isLocked: z.boolean(),
  isAdjustmentWindowOpen: z.boolean(),
  scoringResult: championScoringResultSchema.nullable(),
  pickWindow: pickWindowSchema,
  pickWindowClosesAt: z.string().min(1).nullable(),
  pickWindowPointValue: z.union([z.literal(20), z.literal(10), z.literal(0)])
});

export const saveSubChampionPickInputSchema = z.object({
  subChampionTeamId: z.string().min(1)
});

export const saveSubChampionPickResponseSchema = z.object({
  ok: z.literal(true),
  status: championPickStatusSchema
});

export const adjustSubChampionInputSchema = z.object({
  subChampionTeamId: z.string().min(1)
});

export const adjustSubChampionResponseSchema = z.object({
  ok: z.literal(true),
  status: championPickStatusSchema,
  penaltyNotice: z.string().min(1)
});
