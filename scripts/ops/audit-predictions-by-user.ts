/**
 * READ-ONLY: agrupa predictions por userId y los joinea con users para email/nombre.
 * Útil para entender de quién son las predictions persistidas pre-launch.
 *
 * Uso: npx tsx scripts/ops/audit-predictions-by-user.ts
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

async function main() {
  const usersSnap = await db.collection("users").get();
  const userMap = new Map<string, { email: string; name: string }>();
  for (const u of usersSnap.docs) {
    const d = u.data();
    userMap.set(u.id, { email: d.email ?? "(no-email)", name: d.displayName ?? "(no-name)" });
  }

  const predsSnap = await db.collection("predictions").get();
  const byUser = new Map<string, { count: number; sampleMatches: string[]; createdAtFirst: string | null; createdAtLast: string | null }>();

  for (const doc of predsSnap.docs) {
    const d = doc.data();
    const uid = d.userId ?? "(no-user)";
    const matchId = d.matchId ?? "(no-match)";
    const createdAt = d.createdAt ?? d.updatedAt ?? null;

    const entry = byUser.get(uid) ?? { count: 0, sampleMatches: [], createdAtFirst: null, createdAtLast: null };
    entry.count++;
    if (entry.sampleMatches.length < 5) entry.sampleMatches.push(matchId);
    if (createdAt) {
      const ts = typeof createdAt === "string" ? createdAt : createdAt.toDate?.()?.toISOString?.() ?? String(createdAt);
      if (!entry.createdAtFirst || ts < entry.createdAtFirst) entry.createdAtFirst = ts;
      if (!entry.createdAtLast || ts > entry.createdAtLast) entry.createdAtLast = ts;
    }
    byUser.set(uid, entry);
  }

  console.log(`\n=== PREDICTIONS por USER (total: ${predsSnap.size}) ===\n`);
  const sorted = [...byUser.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [uid, info] of sorted) {
    const u = userMap.get(uid) ?? { email: "(USER NO EXISTE)", name: "(USER NO EXISTE)" };
    console.log(`  ${uid}`);
    console.log(`    user: ${u.name} (${u.email})`);
    console.log(`    predictions: ${info.count}`);
    console.log(`    primera: ${info.createdAtFirst ?? "(no-ts)"}`);
    console.log(`    última:  ${info.createdAtLast ?? "(no-ts)"}`);
    console.log(`    sample matchIds: ${info.sampleMatches.join(", ")}`);
    console.log();
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
