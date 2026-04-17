import { firestore } from "../../../firebase/firebase-admin";
import type { AggregatesLeagueStanding } from "../types";

export class AggregatesLeagueStandingsRepository {
  async replaceStandings(leagueId: string, standings: AggregatesLeagueStanding[]): Promise<void> {
    const batch = firestore.batch();

    for (const standing of standings) {
      const ref = firestore
        .collection("leagueStandings")
        .doc(leagueId)
        .collection("table")
        .doc(standing.userId);
      batch.set(ref, standing, { merge: true });
    }

    await batch.commit();
  }
}

export const aggregatesLeagueStandingsRepository = new AggregatesLeagueStandingsRepository();
