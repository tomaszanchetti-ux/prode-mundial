import { firestore } from "../../../firebase/firebase-admin";
import type { ReminderStoredPrediction } from "../types";

const predictionsCollection = firestore.collection("predictions");

const FIRESTORE_IN_LIMIT = 30;

export class FcmReminderPredictionsRepository {
  async listPredictionsForMatches(matchIds: string[]): Promise<ReminderStoredPrediction[]> {
    if (matchIds.length === 0) {
      return [];
    }

    const chunks: string[][] = [];
    for (let i = 0; i < matchIds.length; i += FIRESTORE_IN_LIMIT) {
      chunks.push(matchIds.slice(i, i + FIRESTORE_IN_LIMIT));
    }

    const aggregate: ReminderStoredPrediction[] = [];
    for (const chunk of chunks) {
      const snapshot = await predictionsCollection.where("matchId", "in", chunk).get();
      for (const doc of snapshot.docs) {
        const data = doc.data() as {
          predictionId: string;
          userId: string;
          matchId: string;
          isLocked?: boolean;
        };
        aggregate.push({
          predictionId: data.predictionId,
          userId: data.userId,
          matchId: data.matchId,
          isLocked: Boolean(data.isLocked)
        });
      }
    }

    return aggregate;
  }
}

export const fcmReminderPredictionsRepository = new FcmReminderPredictionsRepository();
