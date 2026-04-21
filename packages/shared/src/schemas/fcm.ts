import { z } from "zod";

export const fcmPlatformSchema = z.enum(["web", "ios", "android"]);

export const registerFcmTokenInputSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: fcmPlatformSchema,
  userAgent: z.string().max(512).nullable().optional()
});

export const registerFcmTokenResponseSchema = z.object({
  ok: z.literal(true)
});

export type FcmPlatform = z.infer<typeof fcmPlatformSchema>;
export type RegisterFcmTokenInput = z.infer<typeof registerFcmTokenInputSchema>;
export type RegisterFcmTokenResponse = z.infer<typeof registerFcmTokenResponseSchema>;
