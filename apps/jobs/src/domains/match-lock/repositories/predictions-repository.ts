import { firestore } from "../../../firebase/firebase-admin";
import type { JobStoredPrediction } from "../types";

const predictionsCollection = firestore.collection("predictions");

export class MatchLockPredictionsRepository {
  async listPredictionsByMatch(matchId: string): Promise<JobStoredPrediction[]> {
    const snapshot = await predictionsCollection.where("matchId", "==", matchId).get();

    return snapshot.docs.map((doc): JobStoredPrediction => doc.data() as JobStoredPrediction);
  }

  async lockPredictions(predictions: Array<{ predictionId: string; lockedAt: string }>) {
    if (predictions.length === 0) {
      return;
    }

    const batch = firestore.batch();

    for (const prediction of predictions) {
      batch.set(
        predictionsCollection.doc(prediction.predictionId),
        {
          isLocked: true,
          lockedAt: prediction.lockedAt,
          updatedAt: prediction.lockedAt
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}

export const matchLockPredictionsRepository = new MatchLockPredictionsRepository();
