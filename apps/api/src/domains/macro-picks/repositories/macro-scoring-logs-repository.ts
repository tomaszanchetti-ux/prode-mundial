import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredMacroScoringLog } from "../types";

const macroScoringLogsCollection = firestore.collection("macroScoringLogs");

function buildLogId(userId: string, tournamentId: string) {
  return `${userId}_${tournamentId}`;
}

export class MacroScoringLogsRepository {
  async getByUserIdAndTournamentId(userId: string, tournamentId: string): Promise<StoredMacroScoringLog | null> {
    const snapshot = await macroScoringLogsCollection.doc(buildLogId(userId, tournamentId)).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredMacroScoringLog;
  }

  async listByUserId(userId: string): Promise<StoredMacroScoringLog[]> {
    const snapshot = await macroScoringLogsCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredMacroScoringLog);
  }

  async listByTournamentId(tournamentId: string): Promise<StoredMacroScoringLog[]> {
    const snapshot = await macroScoringLogsCollection.where("tournamentId", "==", tournamentId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredMacroScoringLog);
  }

  async upsert(log: StoredMacroScoringLog): Promise<void> {
    await macroScoringLogsCollection.doc(buildLogId(log.userId, log.tournamentId)).set(log, { merge: true });
  }

  async deleteByTournamentId(tournamentId: string): Promise<number> {
    const logs = await this.listByTournamentId(tournamentId);
    await Promise.all(logs.map((log) => macroScoringLogsCollection.doc(buildLogId(log.userId, log.tournamentId)).delete()));
    return logs.length;
  }
}

export const macroScoringLogsRepository = new MacroScoringLogsRepository();
