import { firestore } from "../../../firebase/firebase-admin";
import type { ReminderStoredMatch, ReminderWindow } from "../types";

const matchesCollection = firestore.collection("matches");

export class FcmReminderMatchesRepository {
  async listMatchesInWindow(window: ReminderWindow): Promise<ReminderStoredMatch[]> {
    const snapshot = await matchesCollection
      .where("status", "==", "scheduled")
      .where("kickoffAt", ">=", window.startIso)
      .where("kickoffAt", "<", window.endIso)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as { matchId: string; kickoffAt: string; stage: string };
      return {
        matchId: data.matchId,
        kickoffAt: data.kickoffAt,
        stage: data.stage
      };
    });
  }
}

export const fcmReminderMatchesRepository = new FcmReminderMatchesRepository();
