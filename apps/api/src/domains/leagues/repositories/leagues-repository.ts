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

  async listActiveLeagues(): Promise<StoredLeague[]> {
    const snapshot = await leaguesCollection.where("isActive", "==", true).get();

    return snapshot.docs
      .map((document) => document.data() as StoredLeague)
      .filter((league) => !league.archivedAt);
  }

  async getLeagueById(leagueId: string): Promise<StoredLeague | null> {
    const snapshot = await leaguesCollection.doc(leagueId).get();
    return snapshot.exists ? (snapshot.data() as StoredLeague) : null;
  }

  async findLeagueByInviteCode(inviteCode: string): Promise<StoredLeague | null> {
    const snapshot = await leaguesCollection.where("inviteCode", "==", inviteCode).limit(1).get();
    const document = snapshot.docs[0];
    return document ? (document.data() as StoredLeague) : null;
  }

  async findLeagueByInviteToken(inviteToken: string): Promise<StoredLeague | null> {
    const snapshot = await leaguesCollection.where("inviteToken", "==", inviteToken).limit(1).get();
    const document = snapshot.docs[0];
    return document ? (document.data() as StoredLeague) : null;
  }

  async upsertLeague(league: StoredLeague): Promise<void> {
    await leaguesCollection.doc(league.leagueId).set(league, { merge: true });
  }

  async deleteLeague(leagueId: string): Promise<void> {
    await leaguesCollection.doc(leagueId).delete();
  }
}

export const leaguesRepository = new LeaguesRepository();
