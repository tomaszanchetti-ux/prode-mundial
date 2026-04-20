import type { RegisterFcmTokenInput } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { fcmTokensRepository } from "../repositories/fcm-tokens-repository";

export async function registerFcmToken(
  auth: AuthContext,
  input: RegisterFcmTokenInput
): Promise<void> {
  await fcmTokensRepository.upsert(auth.userId, {
    token: input.token,
    platform: input.platform,
    userAgent: input.userAgent ?? null
  });
}
