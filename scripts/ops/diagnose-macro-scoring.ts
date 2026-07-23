/**
 * Diagnóstico READ-ONLY del scoring macro (Campeón / Sub-Campeón / Balón de Oro).
 *
 * Responde: ¿se ejecutó el scoring de picks macro al terminar el Mundial?
 *
 * Chequea, sin escribir nada:
 *   1. Match FINAL en Firestore → status, equipos, winnerTeamId.
 *   2. Resultados oficiales persistidos: championResults / subChampionResults /
 *      bestPlayerResults.
 *   3. Picks cargados por usuarios: championPicks / subChampionPicks / bestPlayerPicks.
 *   4. Logs de scoring: championScoringLogs (1 doc por user+tournament).
 *   5. Cuánto DEBERÍA sumar cada usuario vs. lo que tiene registrado.
 *
 * Uso:
 *   npx tsx scripts/ops/diagnose-macro-scoring.ts
 *
 * Requiere en .env (root): FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

function initFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan credenciales Firebase en .env");
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  console.log(`🔥 Firestore: ${projectId}\n`);
  return getFirestore();
}

async function main() {
  const db = initFirestore();

  // ── 1. Match FINAL ────────────────────────────────────
  console.log("── 1. Match FINAL ──────────────────────────────");
  const finalSnap = await db.collection("matches").where("stage", "==", "FINAL").get();
  if (finalSnap.empty) {
    console.log("  ❌ No hay ningún match con stage === 'FINAL'");
  }
  for (const doc of finalSnap.docs) {
    const m = doc.data();
    console.log(`  ${doc.id}: status=${m.status} ${m.homeTeamId}(${m.homeScore}) vs ${m.awayTeamId}(${m.awayScore})`);
    console.log(`     winnerTeamId=${m.winnerTeamId ?? "null"} isScored=${m.isScored} kickoff=${m.kickoffAt}`);
  }
  console.log();

  // ── 2. Resultados oficiales persistidos ───────────────
  console.log("── 2. Resultados oficiales persistidos ─────────");
  for (const col of ["championResults", "subChampionResults", "bestPlayerResults"]) {
    const snap = await db.collection(col).get();
    if (snap.empty) {
      console.log(`  ${col}: ❌ VACÍO`);
    } else {
      for (const doc of snap.docs) {
        console.log(`  ${col}/${doc.id}: ${JSON.stringify(doc.data())}`);
      }
    }
  }
  console.log();

  // ── 3. Picks de usuarios ──────────────────────────────
  console.log("── 3. Picks macro cargados por usuarios ────────");
  const [championPicks, subChampionPicks, bestPlayerPicks] = await Promise.all([
    db.collection("championPicks").get(),
    db.collection("subChampionPicks").get(),
    db.collection("bestPlayerPicks").get()
  ]);

  const countWith = (snap: FirebaseFirestore.QuerySnapshot, field: string) =>
    snap.docs.filter((d) => d.data()[field] != null).length;

  console.log(`  championPicks:    ${championPicks.size} docs · ${countWith(championPicks, "championTeamId")} con pick`);
  console.log(`  subChampionPicks: ${subChampionPicks.size} docs · ${countWith(subChampionPicks, "subChampionTeamId")} con pick`);
  console.log(`  bestPlayerPicks:  ${bestPlayerPicks.size} docs · ${countWith(bestPlayerPicks, "bestPlayerId")} con pick`);
  console.log();

  // ── 4. Logs de scoring ────────────────────────────────
  console.log("── 4. championScoringLogs (resultado del batch) ─");
  const logs = await db.collection("championScoringLogs").get();
  if (logs.empty) {
    console.log("  ❌ VACÍO → el batch de scoring macro NUNCA corrió (o no encontró resultados oficiales)");
  } else {
    console.log(`  ${logs.size} logs`);
    const totals = { champion: 0, subChampion: 0, bestPlayer: 0 };
    for (const doc of logs.docs) {
      const l = doc.data();
      totals.champion += l.championPoints ?? 0;
      totals.subChampion += l.subChampionPoints ?? 0;
      totals.bestPlayer += l.bestPlayerPoints ?? 0;
    }
    console.log(`  Puntos repartidos → campeón: ${totals.champion} · sub: ${totals.subChampion} · balón de oro: ${totals.bestPlayer}`);
    console.log(`  Último scoredAt: ${logs.docs.map((d) => d.data().scoredAt).sort().at(-1)}`);
  }
  console.log();

  // ── 5. Simulación: qué DEBERÍA pasar ──────────────────
  console.log("── 5. Simulación (read-only) de aciertos ───────");
  const finalMatch = finalSnap.docs[0]?.data();
  const champion = finalMatch?.winnerTeamId ?? null;
  const subChampion =
    champion && finalMatch
      ? champion === finalMatch.homeTeamId
        ? finalMatch.awayTeamId
        : finalMatch.homeTeamId
      : null;

  console.log(`  Campeón derivable de la Final:     ${champion ?? "❌ no derivable"}`);
  console.log(`  Sub-Campeón derivable de la Final: ${subChampion ?? "❌ no derivable"}`);

  // Reglas: 20 pts si el pick original acertó · 10 pts si acertó tras ajustarlo.
  const tally = (snap: FirebaseFirestore.QuerySnapshot, field: string, official: string) => {
    let original = 0;
    let adjusted = 0;
    for (const d of snap.docs) {
      const p = d.data();
      const active = p.isAdjusted ? p[`adjusted${field[0].toUpperCase()}${field.slice(1)}`] : p[field];
      if (active !== official) continue;
      if (p.isAdjusted) adjusted += 1;
      else original += 1;
    }
    return { original, adjusted, points: original * 20 + adjusted * 10 };
  };

  if (champion) {
    const t = tally(championPicks, "championTeamId", champion);
    console.log(`  → Aciertos campeón: ${t.original + t.adjusted} (${t.original} sin ajustar ×20 + ${t.adjusted} ajustados ×10) = ${t.points} pts`);
  }
  if (subChampion) {
    const t = tally(subChampionPicks, "subChampionTeamId", subChampion);
    console.log(`  → Aciertos sub-campeón: ${t.original + t.adjusted} (${t.original} sin ajustar ×20 + ${t.adjusted} ajustados ×10) = ${t.points} pts`);
  }

  const bpResult = (await db.collection("bestPlayerResults").get()).docs[0]?.data();
  if (!bpResult) {
    console.log(`  → Balón de Oro: ❌ sin resultado oficial cargado (requiere upsert manual)`);
    const dist = new Map<string, number>();
    for (const d of bestPlayerPicks.docs) {
      const p = d.data();
      const active = p.isAdjusted ? p.adjustedBestPlayerId : p.bestPlayerId;
      if (active) dist.set(active, (dist.get(active) ?? 0) + 1);
    }
    const top = [...dist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    console.log(`     Distribución de picks (top 10): ${top.map(([id, n]) => `${id}=${n}`).join(", ") || "(sin picks)"}`);
  }
  console.log();

  // ── 5b. Estado de los perfiles de usuario ─────────────
  console.log("── 5b. Perfiles de usuario (aggregates) ────────");
  const users = await db.collection("users").get();
  const withTotal = users.docs.filter((d) => ((d.data() as Record<string, unknown>).totalPoints as number) > 0);
  const withMacro = users.docs.filter((d) => ((d.data() as Record<string, unknown>).macroPoints as number) > 0);
  console.log(`  users: ${users.size} · con totalPoints>0: ${withTotal.length} · con macroPoints>0: ${withMacro.length}`);
  const top = users.docs
    .map((d) => d.data() as Record<string, unknown>)
    .sort((a, b) => ((b.totalPoints as number) ?? 0) - ((a.totalPoints as number) ?? 0))
    .slice(0, 5);
  for (const u of top) {
    console.log(`    ${u.displayName ?? u.userId}: total=${u.totalPoints} macro=${u.macroPoints ?? 0}`);
  }
  console.log();

  // ── 6. Tournament ids en juego ────────────────────────
  console.log("── 6. tournamentId presentes ───────────────────");
  const tids = new Set<string>();
  for (const d of logs.docs) tids.add(d.data().tournamentId);
  console.log(`  en championScoringLogs: ${[...tids].join(", ") || "(ninguno)"}`);
  const tournaments = await db.collection("tournaments").get().catch(() => null);
  if (tournaments && !tournaments.empty) {
    console.log(`  colección tournaments: ${tournaments.docs.map((d) => d.id).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
