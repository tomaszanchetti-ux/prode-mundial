import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredLeague } from "../types";

const leaguesCollection = firestore.collection("leagues");

export class LeaguesRepository {
  async listLeaguesByIds(leagueIds: string[]): Promise<StoredLeague[]> {
    if (leagueIds.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(leagueIds.map((leagueId) => leaguesCollection.doc(leagueId).get()));

    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => snapshot.data() as StoredLeague);
  }

  async getLeagueById(leagueId: string): Promise<StoredLeague | null> {
    const snapshot = await leaguesCollection.doc(leagueId).get();
    return snapshot.exists ? (snapshot.data() as StoredLeague) : null;
  }

  async upsertLeague(league: StoredLeague): Promise<void> {
    await leaguesCollection.doc(league.leagueId).set(league, { merge: true });
  }
}

export const leaguesRepository = new LeaguesRepository();

