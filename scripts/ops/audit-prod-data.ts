/**
 * READ-ONLY audit de Firestore prod. No escribe nada.
 * Lista users, leagues, memberships, matches y macro picks para validar pre-cleanup.
 *
 * Uso: npx tsx scripts/ops/audit-prod-data.ts
 * Requiere: variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY en .env (root del repo)
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });

const db = getFirestore(app);

const DEMO_USER_IDS = new Set([
  "usr_demo_anchor",
  "usr_demo_guest_1",
  "usr_demo_guest_2",
  "usr_demo_guest_3",
]);
const DEMO_LEAGUE_IDS = new Set(["demo_madrid", "demo_asado"]);
const DEMO_MATCH_IDS = new Set(["demo_m_001", "demo_m_002"]);

function tag(id: string, demoSet: Set<string>) {
  return demoSet.has(id) ? "[DEMO]" : "[REAL]";
}

async function main() {
  console.log(`\n=== AUDIT prod (project: ${requireEnv("FIREBASE_PROJECT_ID")}) ===\n`);

  // 1. USERS
  const usersSnap = await db.collection("users").get();
  console.log(`USERS (${usersSnap.size} total):`);
  const realUsers: string[] = [];
  for (const doc of usersSnap.docs) {
    const d = doc.data();
    const flag = tag(doc.id, DEMO_USER_IDS);
    const email = d.email ?? "(no-email)";
    const name = d.displayName ?? "(no-name)";
    const pts = d.totalPoints ?? 0;
    const macroPts = d.macroPoints ?? 0;
    const leagues = d.leaguesCount ?? 0;
    console.log(`  ${flag} ${doc.id}  email=${email}  name="${name}"  totalPts=${pts}  macroPts=${macroPts}  leagues=${leagues}`);
    if (!DEMO_USER_IDS.has(doc.id)) realUsers.push(doc.id);
  }

  // 2. LEAGUES
  const leaguesSnap = await db.collection("leagues").get();
  console.log(`\nLEAGUES (${leaguesSnap.size} total):`);
  for (const doc of leaguesSnap.docs) {
    const d = doc.data();
    const flag = tag(doc.id, DEMO_LEAGUE_IDS);
    const name = d.name ?? "(no-name)";
    const owner = d.ownerUserId ?? d.ownerUid ?? "(no-owner)";
    const code = d.inviteCode ?? "(no-code)";
    console.log(`  ${flag} ${doc.id}  name="${name}"  owner=${owner}  inviteCode=${code}`);
  }

  // 3. MEMBERSHIPS (por liga)
  console.log(`\nMEMBERSHIPS (por liga):`);
  for (const leagueDoc of leaguesSnap.docs) {
    const memSnap = await db
      .collection("leagueMembers")
      .where("leagueId", "==", leagueDoc.id)
      .get();
    const flag = tag(leagueDoc.id, DEMO_LEAGUE_IDS);
    console.log(`  ${flag} ${leagueDoc.id} (${memSnap.size} members):`);
    for (const m of memSnap.docs) {
      const d = m.data();
      const userFlag = tag(d.userId, DEMO_USER_IDS);
      console.log(`      ${userFlag} ${d.userId}  role=${d.role ?? "(no-role)"}`);
    }
  }

  // 4. STANDINGS counts
  console.log(`\nLEAGUE STANDINGS:`);
  for (const leagueDoc of leaguesSnap.docs) {
    const tableSnap = await db
      .collection("leagueStandings")
      .doc(leagueDoc.id)
      .collection("table")
      .get();
    const flag = tag(leagueDoc.id, DEMO_LEAGUE_IDS);
    console.log(`  ${flag} ${leagueDoc.id}: ${tableSnap.size} rows en table/`);
  }

  // 5. MATCHES (solo conteo + flag de demo)
  const matchesSnap = await db.collection("matches").get();
  let demoMatches = 0;
  for (const doc of matchesSnap.docs) if (DEMO_MATCH_IDS.has(doc.id)) demoMatches++;
  console.log(`\nMATCHES: ${matchesSnap.size} total · demo=${demoMatches} · real=${matchesSnap.size - demoMatches}`);

  // 6. PREDICTIONS (solo conteo + cuántas en matches demo)
  let demoPredictions = 0;
  for (const matchId of DEMO_MATCH_IDS) {
    const snap = await db.collection("predictions").where("matchId", "==", matchId).get();
    demoPredictions += snap.size;
  }
  const allPredsSnap = await db.collection("predictions").get();
  console.log(`\nPREDICTIONS: ${allPredsSnap.size} total · en matches demo=${demoPredictions}`);

  // 7. MACRO PICKS counts (champion / sub / best player) por user
  console.log(`\nMACRO PICKS (por user):`);
  for (const collName of ["championPicks", "subChampionPicks", "bestPlayerPicks"]) {
    const snap = await db.collection(collName).get();
    console.log(`  ${collName}: ${snap.size} docs`);
    for (const doc of snap.docs) {
      const d = doc.data();
      const uid = d.userId ?? doc.id;
      const userFlag = tag(uid, DEMO_USER_IDS);
      console.log(`      ${userFlag} userId=${uid}  pickedTeamId=${d.pickedTeamId ?? d.pickedPlayerId ?? "(none)"}`);
    }
  }

  // 8. RESUMEN
  console.log(`\n=== RESUMEN ===`);
  console.log(`Users reales (NO demo): ${realUsers.length}`);
  console.log(`  → ${realUsers.join(", ") || "(ninguno)"}`);
  console.log(`Leagues demo encontradas: ${leaguesSnap.docs.filter((d) => DEMO_LEAGUE_IDS.has(d.id)).length}/2`);
  console.log(`Matches demo encontrados: ${demoMatches}/2`);
  console.log(`Predictions en matches demo: ${demoPredictions}`);
  console.log(`\nLISTO. Esto es read-only — no se modificó nada.\n`);
}

main().catch((err) => {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
});
