import { firestore } from "../../../server/firebase/firebase-admin";
import type { StoredLeagueStanding } from "../types";

function compareStandings(left: StoredLeagueStanding, right: StoredLeagueStanding) {
  if (left.position !== null && right.position !== null && left.position !== right.position) {
    return left.position - right.position;
  }

  if (left.totalPoints !== right.totalPoints) {
    return right.totalPoints - left.totalPoints;
  }

  if (left.exactHits !== right.exactHits) {
    return right.exactHits - left.exactHits;
  }

  if (left.correctSigns !== right.correctSigns) {
    return right.correctSigns - left.correctSigns;
  }

  if (left.macroPoints !== right.macroPoints) {
    return right.macroPoints - left.macroPoints;
  }

  return left.displayName.localeCompare(right.displayName);
}

export class LeagueStandingsRepository {
  async listStandingsByLeague(leagueId: string): Promise<StoredLeagueStanding[]> {
    const snapshot = await firestore.collection("leagueStandings").doc(leagueId).collection("table").get();

    return snapshot.docs
      .map((doc) => doc.data() as StoredLeagueStanding)
      .sort(compareStandings);
  }

  async getStanding(leagueId: string, userId: string): Promise<StoredLeagueStanding | null> {
    const snapshot = await firestore.collection("leagueStandings").doc(leagueId).collection("table").doc(userId).get();
    return snapshot.exists ? (snapshot.data() as StoredLeagueStanding) : null;
  }

  async replaceStandings(leagueId: string, standings: StoredLeagueStanding[]): Promise<void> {
    const tableRef = firestore.collection("leagueStandings").doc(leagueId).collection("table");
    const batch = firestore.batch();

    // Borrar filas de ex-miembros: sin esto, quien abandona la liga queda
    // como fila fantasma con posición duplicada.
    const currentUserIds = new Set(standings.map((standing) => standing.userId));
    const existing = await tableRef.get();
    for (const doc of existing.docs) {
      if (!currentUserIds.has(doc.id)) {
        batch.delete(doc.ref);
      }
    }

    for (const standing of standings) {
      batch.set(tableRef.doc(standing.userId), standing, { merge: true });
    }

    await batch.commit();
  }

  async deleteStandings(leagueId: string): Promise<void> {
    const snapshot = await firestore.collection("leagueStandings").doc(leagueId).collection("table").get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    await firestore.collection("leagueStandings").doc(leagueId).delete().catch(() => undefined);
  }
}

export const leagueStandingsRepository = new LeagueStandingsRepository();

