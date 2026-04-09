import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredPrediction } from "../types";
import type { ValidatedPredictionInput } from "../services/prediction-domain";
import { buildPredictionId, createStoredPrediction, mergeStoredPrediction } from "../services/prediction-persistence";

const predictionsCollection = firestore.collection("predictions");

export class PredictionsRepository {
  async getPredictionByUserAndMatch(userId: string, matchId: string): Promise<StoredPrediction | null> {
    const snapshot = await predictionsCollection.where("userId", "==", userId).get();
    const prediction = snapshot.docs
      .map((doc) => doc.data() as StoredPrediction)
      .find((item) => item.matchId === matchId);

    return prediction ?? null;
  }

  async listPredictionsByUserForMatches(userId: string, matchIds: string[]): Promise<Map<string, StoredPrediction>> {
    if (matchIds.length === 0) {
      return new Map();
    }

    const matchIdSet = new Set(matchIds);
    const snapshot = await predictionsCollection.where("userId", "==", userId).get();

    return snapshot.docs.reduce<Map<string, StoredPrediction>>((accumulator, doc) => {
      const prediction = doc.data() as StoredPrediction;

      if (matchIdSet.has(prediction.matchId)) {
        accumulator.set(prediction.matchId, prediction);
      }

      return accumulator;
    }, new Map());
  }

  async upsertPrediction(userId: string, matchId: string, input: ValidatedPredictionInput): Promise<StoredPrediction> {
    const nowIso = new Date().toISOString();
    const existing = await this.getPredictionByUserAndMatch(userId, matchId);

    if (existing) {
      const updated = mergeStoredPrediction(existing, input, nowIso);
      await predictionsCollection.doc(existing.predictionId).set(updated);
      return updated;
    }

    const created = createStoredPrediction(
      {
        userId,
        matchId,
        ...input
      },
      nowIso
    );

    await predictionsCollection.doc(buildPredictionId(userId, matchId)).set(created);
    return created;
  }
}

export const predictionsRepository = new PredictionsRepository();
