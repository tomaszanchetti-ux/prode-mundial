import { firestore } from "../../../firebase/firebase-admin";
import type { SyncStoredPrediction } from "../types";

const predictionsCollection = firestore.collection("predictions");

export class MatchSyncPredictionsRepository {
  async listPredictionsByMatch(matchId: string): Promise<SyncStoredPrediction[]> {
    const snapshot = await predictionsCollection.where("matchId", "==", matchId).get();
    return snapshot.docs.map((doc) => doc.data() as SyncStoredPrediction);
  }

  async updatePrediction(predictionId: string, patch: Partial<SyncStoredPrediction>): Promise<void> {
    await predictionsCollection.doc(predictionId).set(patch, { merge: true });
  }
}

export const matchSyncPredictionsRepository = new MatchSyncPredictionsRepository();
