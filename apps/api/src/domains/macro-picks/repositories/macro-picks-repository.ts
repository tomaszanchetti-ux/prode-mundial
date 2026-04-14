import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredMacroPrediction } from "../types";

const macroPredictionsCollection = firestore.collection("macroPredictions");

export class MacroPicksRepository {
  async getByUserId(userId: string): Promise<StoredMacroPrediction | null> {
    const snapshot = await macroPredictionsCollection.doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredMacroPrediction;
  }

  async upsert(prediction: StoredMacroPrediction): Promise<void> {
    await macroPredictionsCollection.doc(prediction.userId).set(prediction, { merge: true });
  }

  async listSubmitted(): Promise<StoredMacroPrediction[]> {
    const snapshot = await macroPredictionsCollection.where("isSubmitted", "==", true).get();
    return snapshot.docs.map((doc) => doc.data() as StoredMacroPrediction);
  }
}

export const macroPicksRepository = new MacroPicksRepository();
