import { firestore } from "../../../firebase/firebase-admin";
import type { AggregatesLeagueStanding } from "../types";

export class AggregatesLeagueStandingsRepository {
  async replaceStandings(leagueId: string, standings: AggregatesLeagueStanding[]): Promise<void> {
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
}

export const aggregatesLeagueStandingsRepository = new AggregatesLeagueStandingsRepository();
