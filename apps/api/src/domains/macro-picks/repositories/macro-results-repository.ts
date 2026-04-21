import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredBestPlayerResult, StoredChampionResult, StoredSubChampionResult } from "../types";

const championResultsCollection = firestore.collection("championResults");
const subChampionResultsCollection = firestore.collection("subChampionResults");
const bestPlayerResultsCollection = firestore.collection("bestPlayerResults");

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

export class SubChampionResultsRepository {
  async getByTournamentId(tournamentId: string): Promise<StoredSubChampionResult | null> {
    const snapshot = await subChampionResultsCollection.doc(tournamentId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredSubChampionResult;
  }

  async upsert(results: StoredSubChampionResult): Promise<void> {
    await subChampionResultsCollection.doc(results.tournamentId).set(results, { merge: true });
  }
}

export const subChampionResultsRepository = new SubChampionResultsRepository();

export class BestPlayerResultsRepository {
  async getByTournamentId(tournamentId: string): Promise<StoredBestPlayerResult | null> {
    const snapshot = await bestPlayerResultsCollection.doc(tournamentId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredBestPlayerResult;
  }

  async upsert(results: StoredBestPlayerResult): Promise<void> {
    await bestPlayerResultsCollection.doc(results.tournamentId).set(results, { merge: true });
  }
}

export const bestPlayerResultsRepository = new BestPlayerResultsRepository();
