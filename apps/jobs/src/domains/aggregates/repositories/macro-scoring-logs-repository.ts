import { firestore } from "../../../firebase/firebase-admin";
import type { AggregatesChampionScoringLog } from "../types";

const championScoringLogsCollection = firestore.collection("championScoringLogs");

export class AggregatesChampionScoringLogsRepository {
  async listByUserId(userId: string): Promise<AggregatesChampionScoringLog[]> {
    const snapshot = await championScoringLogsCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as AggregatesChampionScoringLog);
  }
}

export const aggregatesChampionScoringLogsRepository = new AggregatesChampionScoringLogsRepository();
