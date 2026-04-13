import { z } from "zod";

import {
  MACRO_GROUP_IDS,
  MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL,
  MACRO_PICKS_STATUSES
} from "../constants/macro-picks";

const macroGroupPickShape = Object.fromEntries(
  MACRO_GROUP_IDS.map((groupId) => [
    groupId,
    z.object({
      firstTeamId: z.string().trim().min(1),
      secondTeamId: z.string().trim().min(1)
    })
  ])
);

export const macroGroupIdSchema = z.enum(MACRO_GROUP_IDS);

export const macroPicksStatusSchema = z.enum(MACRO_PICKS_STATUSES);

export const macroGroupPickSchema = z
  .object({
    firstTeamId: z.string().trim().min(1),
    secondTeamId: z.string().trim().min(1)
  });

export const macroGroupPicksSchema = z.object(macroGroupPickShape).partial();

export const macroPicksCompletionSchema = z.object({
  groupsCompleted: z.number().int().min(0).max(MACRO_GROUP_IDS.length),
  groupsTotal: z.literal(MACRO_GROUP_IDS.length),
  hasFinalists: z.boolean(),
  hasChampion: z.boolean(),
  percent: z.number().int().min(0).max(100)
});

export const macroPicksAdjustmentWindowSchema = z.object({
  opensAt: z.string().trim().min(1).nullable(),
  closesAt: z.string().trim().min(1).nullable()
});

export const macroPicksResponseSchema = z.object({
  status: macroPicksStatusSchema,
  isLocked: z.boolean(),
  adjustmentAvailable: z.boolean(),
  adjustmentAlreadyUsed: z.boolean(),
  initialDeadlineAt: z.string().trim().min(1),
  adjustmentWindow: macroPicksAdjustmentWindowSchema,
  groupPicks: macroGroupPicksSchema,
  finalists: z.array(z.string().trim().min(1)).max(2),
  champion: z.string().trim().min(1).nullable(),
  adjustedFinalists: z.array(z.string().trim().min(1)).max(2).optional(),
  adjustedChampion: z.string().trim().min(1).nullable().optional(),
  adjustmentConfirmedAt: z.string().trim().min(1).nullable().optional(),
  completion: macroPicksCompletionSchema
});

export const saveMacroPicksInputSchema = z.object({
  groupPicks: macroGroupPicksSchema,
  finalists: z.array(z.string().trim().min(1)).max(2),
  champion: z.string().trim().min(1).nullable()
});

export const saveMacroPicksResponseSchema = z.object({
  status: macroPicksStatusSchema,
  savedAt: z.string().trim().min(1),
  completionPercent: z.number().int().min(0).max(100)
});

export const confirmMacroAdjustmentInputSchema = z.object({
  finalists: z.array(z.string().trim().min(1)).length(2),
  champion: z.string().trim().min(1)
});

export const macroPicksPenaltyModelSchema = z.object({
  finalistPoints: z.literal(MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL.finalistPoints),
  championPoints: z.literal(MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL.championPoints)
});

export const confirmMacroAdjustmentResponseSchema = z.object({
  status: z.literal("adjusted_locked"),
  adjustmentConfirmedAt: z.string().trim().min(1),
  adjustedFinalists: z.array(z.string().trim().min(1)).length(2),
  adjustedChampion: z.string().trim().min(1),
  penaltyModel: macroPicksPenaltyModelSchema
});
