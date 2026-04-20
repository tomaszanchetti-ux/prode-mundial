import type { FcmPlatform } from "@prode/shared";
import { firestore } from "../../../server/firebase/firebase-admin";

export type StoredFcmToken = {
  token: string;
  platform: FcmPlatform;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
};

function tokensCollection(userId: string) {
  return firestore.collection("users").doc(userId).collection("fcmTokens");
}

export class FcmTokensRepository {
  async upsert(
    userId: string,
    input: { token: string; platform: FcmPlatform; userAgent: string | null }
  ): Promise<void> {
    const collection = tokensCollection(userId);
    const now = new Date().toISOString();

    const existing = await collection.where("token", "==", input.token).limit(1).get();

    if (!existing.empty) {
      const docRef = existing.docs[0]!.ref;
      await docRef.update({
        platform: input.platform,
        userAgent: input.userAgent,
        lastSeenAt: now
      });
      return;
    }

    await collection.add({
      token: input.token,
      platform: input.platform,
      userAgent: input.userAgent,
      createdAt: now,
      lastSeenAt: now
    } satisfies StoredFcmToken);
  }
}

export const fcmTokensRepository = new FcmTokensRepository();
