import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredMacroTournamentResults } from "../types";

const macroResultsCollection = firestore.collection("macroResults");

export class MacroResultsRepository {
  async getByTournamentId(tournamentId: string): Promise<StoredMacroTournamentResults | null> {
    const snapshot = await macroResultsCollection.doc(tournamentId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredMacroTournamentResults;
  }

  async upsert(results: StoredMacroTournamentResults): Promise<void> {
    await macroResultsCollection.doc(results.tournamentId).set(results, { merge: true });
  }
}

export const macroResultsRepository = new MacroResultsRepository();
