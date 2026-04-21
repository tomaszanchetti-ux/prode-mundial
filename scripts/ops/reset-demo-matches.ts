/**
 * One-off script: resetea m_002, m_003, m_004 en Firestore a status "scheduled".
 * Estos partidos tenían status demo (live/finished) del seed inicial.
 *
 * Uso: npx tsx scripts/ops/reset-demo-matches.ts
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

const MATCH_IDS = ["m_002", "m_003", "m_004"];

const RESET_FIELDS = {
  status: "scheduled",
  homeScore90: null,
  awayScore90: null,
  winnerTeamId: null,
  isLocked: false,
  isScored: false,
};

async function main() {
  console.log(`Resetting ${MATCH_IDS.length} matches to scheduled...`);

  const batch = db.batch();

  for (const matchId of MATCH_IDS) {
    const ref = db.collection("matches").doc(matchId);
    const snap = await ref.get();

    if (!snap.exists) {
      console.warn(`  SKIP ${matchId} — not found in Firestore`);
      continue;
    }

    const current = snap.data()!;
    console.log(`  ${matchId}: ${current.status} → scheduled (was locked=${current.isLocked}, scored=${current.isScored})`);
    batch.update(ref, RESET_FIELDS);
  }

  await batch.commit();
  console.log("Matches reset.");

  // Also unlock any predictions for these matches
  console.log("Unlocking predictions for affected matches...");
  let unlocked = 0;

  for (const matchId of MATCH_IDS) {
    const predsSnap = await db.collection("predictions").where("matchId", "==", matchId).get();

    if (predsSnap.empty) {
      console.log(`  ${matchId}: no predictions found`);
      continue;
    }

    const predBatch = db.batch();
    for (const doc of predsSnap.docs) {
      const data = doc.data();
      if (data.isLocked) {
        predBatch.update(doc.ref, { isLocked: false, isScored: false, pointsAwarded: 0 });
        unlocked++;
      }
    }
    await predBatch.commit();
    console.log(`  ${matchId}: ${predsSnap.size} predictions found, ${unlocked} unlocked`);
  }

  console.log(`Done. ${MATCH_IDS.length} matches reset, ${unlocked} predictions unlocked.`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
