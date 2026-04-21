import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredChampionPick } from "../types";

const championPicksCollection = firestore.collection("championPicks");

export class ChampionPicksRepository {
  async getByUserId(userId: string): Promise<StoredChampionPick | null> {
    const snapshot = await championPicksCollection.doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredChampionPick;
  }

  async upsert(pick: StoredChampionPick): Promise<void> {
    await championPicksCollection.doc(pick.userId).set(pick, { merge: true });
  }

  async listAll(): Promise<StoredChampionPick[]> {
    const snapshot = await championPicksCollection.get();
    return snapshot.docs.map((doc) => doc.data() as StoredChampionPick);
  }
}

export const championPicksRepository = new ChampionPicksRepository();
