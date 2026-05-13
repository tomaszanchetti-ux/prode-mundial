import { z } from "zod";
import { USER_PLANS } from "../types/billing";

export const userPlanSchema = z.enum(USER_PLANS);

export const userProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  country: z.string().max(2).nullable(),
  photoUrl: z.string().url().nullable(),
  totalPoints: z.number().int().nonnegative(),
  macroPoints: z.number().int().nonnegative(),
  exactHits: z.number().int().nonnegative(),
  correctSigns: z.number().int().nonnegative(),
  leaguesCount: z.number().int().nonnegative(),
  profileCompleted: z.boolean(),
  plan: userPlanSchema,
  goldUpgradedAt: z.string().min(1).nullable()
});

export const updateProfileInputSchema = z.object({
  displayName: z.string().min(2).max(50),
  country: z.string().max(2).nullable().optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
