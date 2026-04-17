import { firestore } from "../../../firebase/firebase-admin";
import type { AggregatesLeagueMember } from "../types";

const leagueMembersCollection = firestore.collection("leagueMembers");

export class AggregatesLeagueMembersRepository {
  async listMembershipsByUser(userId: string): Promise<AggregatesLeagueMember[]> {
    const snapshot = await leagueMembersCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as AggregatesLeagueMember);
  }

  async listMembershipsByLeague(leagueId: string): Promise<AggregatesLeagueMember[]> {
    const snapshot = await leagueMembersCollection.where("leagueId", "==", leagueId).get();
    return snapshot.docs.map((doc) => doc.data() as AggregatesLeagueMember);
  }
}

export const aggregatesLeagueMembersRepository = new AggregatesLeagueMembersRepository();
