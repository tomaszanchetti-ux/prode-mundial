import { firestore } from "../../../firebase/firebase-admin";
import type { ReminderStoredToken } from "../types";

export class FcmReminderTokensRepository {
  async listAllTokens(): Promise<ReminderStoredToken[]> {
    const snapshot = await firestore.collectionGroup("fcmTokens").get();

    return snapshot.docs
      .map((doc): ReminderStoredToken | null => {
        const data = doc.data() as { token?: string };
        const token = typeof data.token === "string" ? data.token : null;
        if (!token) return null;

        const userId = doc.ref.parent.parent?.id;
        if (!userId) return null;

        return {
          userId,
          tokenId: doc.id,
          token
        };
      })
      .filter((entry): entry is ReminderStoredToken => entry !== null);
  }

  async deleteToken(userId: string, tokenId: string): Promise<void> {
    await firestore.collection("users").doc(userId).collection("fcmTokens").doc(tokenId).delete();
  }
}

export const fcmReminderTokensRepository = new FcmReminderTokensRepository();
