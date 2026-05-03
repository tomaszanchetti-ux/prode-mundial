import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredLeagueMember } from "../types";

const leagueMembersCollection = firestore.collection("leagueMembers");

export class LeagueMembersRepository {
  async listMembershipsByUser(userId: string): Promise<StoredLeagueMember[]> {
    const snapshot = await leagueMembersCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredLeagueMember);
  }

  async listMembershipsByLeague(leagueId: string): Promise<StoredLeagueMember[]> {
    const snapshot = await leagueMembersCollection.where("leagueId", "==", leagueId).get();
    return snapshot.docs.map((doc) => doc.data() as StoredLeagueMember);
  }

  async findMembership(leagueId: string, userId: string): Promise<StoredLeagueMember | null> {
    const snapshot = await leagueMembersCollection.where("leagueId", "==", leagueId).get();
    const membership = snapshot.docs
      .map((doc) => doc.data() as StoredLeagueMember)
      .find((item) => item.userId === userId);

    return membership ?? null;
  }

  async upsertMembership(membership: StoredLeagueMember): Promise<void> {
    await leagueMembersCollection.doc(membership.membershipId).set(membership, { merge: true });
  }

  async deleteMembership(membershipId: string): Promise<void> {
    await leagueMembersCollection.doc(membershipId).delete();
  }

  async deleteMembershipsByLeague(leagueId: string): Promise<void> {
    const snapshot = await leagueMembersCollection.where("leagueId", "==", leagueId).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
}

export const leagueMembersRepository = new LeagueMembersRepository();

