import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredBestPlayerPick } from "../types";

const bestPlayerPicksCollection = firestore.collection("bestPlayerPicks");

export class BestPlayerPicksRepository {
  async getByUserId(userId: string): Promise<StoredBestPlayerPick | null> {
    const snapshot = await bestPlayerPicksCollection.doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredBestPlayerPick;
  }

  async upsert(pick: StoredBestPlayerPick): Promise<void> {
    await bestPlayerPicksCollection.doc(pick.userId).set(pick, { merge: true });
  }

  async listAll(): Promise<StoredBestPlayerPick[]> {
    const snapshot = await bestPlayerPicksCollection.get();
    return snapshot.docs.map((doc) => doc.data() as StoredBestPlayerPick);
  }
}

export const bestPlayerPicksRepository = new BestPlayerPicksRepository();
