import { firestore } from "../../../firebase/firebase-admin";
import type { SyncStoredMatch } from "../types";

const matchesCollection = firestore.collection("matches");

export class MatchSyncMatchesRepository {
  async listAllMatches(): Promise<SyncStoredMatch[]> {
    const snapshot = await matchesCollection.get();
    return snapshot.docs.map((doc) => doc.data() as SyncStoredMatch);
  }

  async updateMatch(matchId: string, patch: Partial<SyncStoredMatch>): Promise<void> {
    if ("kickoffAt" in patch) {
      throw new Error(
        `Refusing to overwrite kickoffAt for match ${matchId}. ` +
          `Kickoffs are seeded from world-cup-2026-canonical-matches.json and must not be mutated by sync jobs.`
      );
    }
    await matchesCollection.doc(matchId).set(patch, { merge: true });
  }
}

export const matchSyncMatchesRepository = new MatchSyncMatchesRepository();
