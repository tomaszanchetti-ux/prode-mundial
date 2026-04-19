import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredSubChampionPick } from "../types";

const subChampionPicksCollection = firestore.collection("subChampionPicks");

export class SubChampionPicksRepository {
  async getByUserId(userId: string): Promise<StoredSubChampionPick | null> {
    const snapshot = await subChampionPicksCollection.doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredSubChampionPick;
  }

  async upsert(pick: StoredSubChampionPick): Promise<void> {
    await subChampionPicksCollection.doc(pick.userId).set(pick, { merge: true });
  }

  async listAll(): Promise<StoredSubChampionPick[]> {
    const snapshot = await subChampionPicksCollection.get();
    return snapshot.docs.map((doc) => doc.data() as StoredSubChampionPick);
  }
}

export const subChampionPicksRepository = new SubChampionPicksRepository();
