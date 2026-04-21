import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredChampionScoringLog } from "../types";

const championScoringLogsCollection = firestore.collection("championScoringLogs");

function buildLogId(userId: string, tournamentId: string) {
  return `${userId}_${tournamentId}`;
}

export class ChampionScoringLogsRepository {
  async getByUserIdAndTournamentId(userId: string, tournamentId: string): Promise<StoredChampionScoringLog | null> {
    const snapshot = await championScoringLogsCollection.doc(buildLogId(userId, tournamentId)).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredChampionScoringLog;
  }

  async listByUserId(userId: string): Promise<StoredChampionScoringLog[]> {
    const snapshot = await championScoringLogsCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredChampionScoringLog);
  }

  async listByTournamentId(tournamentId: string): Promise<StoredChampionScoringLog[]> {
    const snapshot = await championScoringLogsCollection.where("tournamentId", "==", tournamentId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredChampionScoringLog);
  }

  async upsert(log: StoredChampionScoringLog): Promise<void> {
    await championScoringLogsCollection.doc(buildLogId(log.userId, log.tournamentId)).set(log, { merge: true });
  }

  async deleteByTournamentId(tournamentId: string): Promise<number> {
    const logs = await this.listByTournamentId(tournamentId);
    await Promise.all(logs.map((log) => championScoringLogsCollection.doc(buildLogId(log.userId, log.tournamentId)).delete()));
    return logs.length;
  }
}

export const championScoringLogsRepository = new ChampionScoringLogsRepository();
