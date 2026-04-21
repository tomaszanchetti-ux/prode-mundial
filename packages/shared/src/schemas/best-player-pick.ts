import { z } from "zod";
import { CHAMPION_PICK_STATUSES } from "../constants/macro-picks";
import { championScoringResultSchema, pickWindowSchema } from "./macro-picks";

export const bestPlayerPickStatusSchema = z.enum(CHAMPION_PICK_STATUSES);

export const bestPlayerPickResponseSchema = z.object({
  status: bestPlayerPickStatusSchema,
  bestPlayerId: z.string().min(1).nullable(),
  adjustedBestPlayerId: z.string().min(1).nullable(),
  initialDeadlineAt: z.string().min(1).nullable(),
  adjustmentWindowOpensAt: z.string().min(1).nullable(),
  adjustmentWindowClosesAt: z.string().min(1).nullable(),
  isLocked: z.boolean(),
  isAdjustmentWindowOpen: z.boolean(),
  scoringResult: championScoringResultSchema.nullable(),
  pickWindow: pickWindowSchema,
  pickWindowClosesAt: z.string().min(1).nullable(),
  pickWindowPointValue: z.union([z.literal(25), z.literal(10), z.literal(0)])
});

export const saveBestPlayerPickInputSchema = z.object({
  bestPlayerId: z.string().min(1)
});

export const saveBestPlayerPickResponseSchema = z.object({
  ok: z.literal(true),
  status: bestPlayerPickStatusSchema
});

export const adjustBestPlayerInputSchema = z.object({
  bestPlayerId: z.string().min(1)
});

export const adjustBestPlayerResponseSchema = z.object({
  ok: z.literal(true),
  status: bestPlayerPickStatusSchema,
  penaltyNotice: z.string().min(1)
});
