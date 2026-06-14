import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredTeam } from "../types";

const teamsCollection = firestore.collection("teams");

export class TeamsRepository {
  async listTeams(): Promise<StoredTeam[]> {
    const snapshot = await teamsCollection.get();
    return snapshot.docs.map((doc) => doc.data() as StoredTeam);
  }

  async getTeamsByIds(teamIds: string[]): Promise<Map<string, StoredTeam>> {
    const uniqueIds = [...new Set(teamIds.filter(Boolean))];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const snapshots = await Promise.all(uniqueIds.map((teamId) => teamsCollection.doc(teamId).get()));

    return snapshots.reduce<Map<string, StoredTeam>>((accumulator, snapshot) => {
      if (snapshot.exists) {
        const team = snapshot.data() as StoredTeam;
        accumulator.set(team.teamId, team);
      }

      return accumulator;
    }, new Map());
  }
}

export const teamsRepository = new TeamsRepository();
