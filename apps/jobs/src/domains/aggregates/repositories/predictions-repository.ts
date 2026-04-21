import { firestore } from "../../../firebase/firebase-admin";
import type { SyncStoredPrediction } from "../../match-sync/types";

const predictionsCollection = firestore.collection("predictions");

export class AggregatesPredictionsRepository {
  async listPredictionsByUser(userId: string): Promise<SyncStoredPrediction[]> {
    const snapshot = await predictionsCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as SyncStoredPrediction);
  }
}

export const aggregatesPredictionsRepository = new AggregatesPredictionsRepository();
