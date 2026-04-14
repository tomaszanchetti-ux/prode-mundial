import { firestore } from "../../../firebase/firebase-admin";
import type { SyncStoredMatch } from "../types";

const matchesCollection = firestore.collection("matches");

export class MatchSyncMatchesRepository {
  async listAllMatches(): Promise<SyncStoredMatch[]> {
    const snapshot = await matchesCollection.get();
    return snapshot.docs.map((doc) => doc.data() as SyncStoredMatch);
  }

  async updateMatch(matchId: string, patch: Partial<SyncStoredMatch>): Promise<void> {
    await matchesCollection.doc(matchId).set(patch, { merge: true });
  }
}

export const matchSyncMatchesRepository = new MatchSyncMatchesRepository();
