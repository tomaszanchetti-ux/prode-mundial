import { firestore } from "../../../firebase/firebase-admin";
import type { JobStoredMatch } from "../types";

const matchesCollection = firestore.collection("matches");

export class MatchLockMatchesRepository {
  async listMatchesPendingLock(nowIso: string): Promise<JobStoredMatch[]> {
    const snapshot = await matchesCollection.where("status", "==", "scheduled").where("kickoffAt", "<=", nowIso).get();

    return snapshot.docs
      .map((doc): JobStoredMatch => doc.data() as JobStoredMatch)
      .filter((match: JobStoredMatch) => !match.isLocked);
  }

  async lockMatches(matchIds: string[]) {
    if (matchIds.length === 0) {
      return;
    }

    const batch = firestore.batch();

    for (const matchId of matchIds) {
      batch.set(
        matchesCollection.doc(matchId),
        {
          isLocked: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}

export const matchLockMatchesRepository = new MatchLockMatchesRepository();
