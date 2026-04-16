import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredChampionResult } from "../types";

const championResultsCollection = firestore.collection("championResults");

export class ChampionResultsRepository {
  async getByTournamentId(tournamentId: string): Promise<StoredChampionResult | null> {
    const snapshot = await championResultsCollection.doc(tournamentId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredChampionResult;
  }

  async upsert(results: StoredChampionResult): Promise<void> {
    await championResultsCollection.doc(results.tournamentId).set(results, { merge: true });
  }
}

export const championResultsRepository = new ChampionResultsRepository();
