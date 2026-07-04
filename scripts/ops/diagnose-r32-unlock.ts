/**
 * Diagnóstico read-only para entender por qué R32 (16vos) no se habilita.
 *
 * Tres capas independientes:
 *   1. Lógica pura (sin credenciales): ¿planFullHydration desbloquearía R32
 *      si todos los grupos tuvieran marcador 90'?
 *   2. football-data.org (opcional): ¿responde la API y trae partidos FINISHED?
 *   3. Firestore prod/local (opcional): ¿cuántos grupos tienen score y cuántos
 *      R32 tienen equipos hidratados?
 *
 * Uso:
 *   npx tsx scripts/ops/diagnose-r32-unlock.ts
 *
 * Requiere en .env (root) para capas 2 y 3:
 *   FOOTBALL_DATA_API_KEY
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  planFullHydration,
  type GroupDefinition,
  type HydrationMatch
} from "@prode/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const CANONICAL_MATCHES_PATH = resolve(
  __dirname,
  "../../apps/api/src/domains/matches/data/world-cup-2026-canonical-matches.json"
);

type CanonicalMatch = {
  matchId: string;
  stage: string;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSlot?: string | null;
  awaySlot?: string | null;
  officialMatchNumber?: number;
  homeScore90?: number | null;
  awayScore90?: number | null;
  status: string;
};

function section(title: string) {
  console.log(`\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}`);
}

async function loadHydrationGroups(): Promise<GroupDefinition[]> {
  const { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_TEAMS } = await import(
    "../../apps/api/src/domains/matches/data/world-cup-2026.ts"
  );
  const names = new Map(WORLD_CUP_2026_TEAMS.map((team) => [team.teamId, team.name]));
  return WORLD_CUP_2026_GROUPS.map((group) => ({
    groupId: group.groupId,
    teams: group.teamIds.map((teamId) => ({
      teamId,
      teamName: names.get(teamId) ?? teamId
    }))
  }));
}

function toHydrationMatch(row: CanonicalMatch): HydrationMatch {
  return {
    matchId: row.matchId,
    stage: row.stage,
    officialMatchNumber: row.officialMatchNumber,
    groupId: row.groupId,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    homeSlot: row.homeSlot ?? null,
    awaySlot: row.awaySlot ?? null,
    homeScore90: row.homeScore90 ?? null,
    awayScore90: row.awayScore90 ?? null,
    winnerTeamId: null,
    status: row.status
  };
}

async function runPureLogicDiagnostic() {
  section("1) Lógica pura — ¿R32 se desbloquearía con grupos cerrados?");

  const raw = JSON.parse(readFileSync(CANONICAL_MATCHES_PATH, "utf8")) as { matches: CanonicalMatch[] };
  const groups = await loadHydrationGroups();
  const matches = raw.matches.map(toHydrationMatch);

  const groupMatches = matches.filter((m) => m.stage === "group");
  const r32Matches = matches.filter((m) => m.stage === "R32");

  console.log(`Partidos de grupo en fixture: ${groupMatches.length}`);
  console.log(`Partidos R32 en fixture: ${r32Matches.length}`);

  const before = planFullHydration(matches, groups);
  console.log("\nEstado ACTUAL del seed canonical (sin simular resultados):");
  console.log(`  groupMatchesFinalized: ${before.groupMatchesFinalized}/${before.groupMatchesTotal}`);
  console.log(`  phaseUnlocks.r32: ${before.phaseUnlocks.r32}`);
  console.log(`  patches R32 pendientes: ${before.r32Patches.length}`);

  const simulated = matches.map((match) => {
    if (match.stage !== "group") {
      return match;
    }

    return {
      ...match,
      homeScore90: 1,
      awayScore90: 0,
      status: "finished"
    };
  });

  const after = planFullHydration(simulated, groups);
  console.log("\nSimulación: todos los grupos con marcador 90':");
  console.log(`  groupMatchesFinalized: ${after.groupMatchesFinalized}/${after.groupMatchesTotal}`);
  console.log(`  phaseUnlocks.r32: ${after.phaseUnlocks.r32}`);
  console.log(`  patches R32: ${after.r32Patches.length}`);
  console.log(`  unresolvedSlots: ${after.unresolvedSlots.length ? after.unresolvedSlots.join(", ") : "(ninguno)"}`);

  if (after.phaseUnlocks.r32 && after.r32Patches.length === r32Matches.length) {
    console.log("\n✅ La lógica de hidratación funciona. Si prod falla, el problema NO es el resolver.");
  } else {
    console.log("\n❌ La lógica pura no desbloquea R32 — revisar resolver / fixture.");
  }
}

async function runFootballDataDiagnostic() {
  section("2) football-data.org — conectividad y partidos FINISHED");

  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!apiKey || apiKey === "replace-me" || apiKey === "your-api-key-here") {
    console.log("⏭️  Saltado: FOOTBALL_DATA_API_KEY no configurada en .env");
    return;
  }

  const url =
    "https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED,FINISHED";

  const response = await fetch(url, {
    headers: { "X-Auth-Token": apiKey }
  });

  console.log(`HTTP ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.log(`❌ Error de API:\n${body.slice(0, 500)}`);
    console.log("\nPosibles causas: key inválida, rate limit, o competición WC no disponible.");
    return;
  }

  const data = (await response.json()) as {
    count: number;
    matches: Array<{
      id: number;
      status: string;
      stage: string;
      group: string | null;
      homeTeam: { tla: string };
      awayTeam: { tla: string };
      score: { fullTime: { home: number | null; away: number | null } };
    }>;
  };

  const finished = data.matches.filter((m) => m.status === "FINISHED");
  const groupFinished = finished.filter((m) => m.stage === "GROUP_STAGE");
  const knockoutFinished = finished.filter((m) => m.stage !== "GROUP_STAGE");

  console.log(`Partidos devueltos: ${data.count}`);
  console.log(`  FINISHED total: ${finished.length}`);
  console.log(`  FINISHED group stage: ${groupFinished.length}`);
  console.log(`  FINISHED knockout: ${knockoutFinished.length}`);

  if (groupFinished.length > 0) {
    const sample = groupFinished[0];
    console.log(
      `\nEjemplo grupo FINISHED: ${sample.homeTeam.tla} vs ${sample.awayTeam.tla} ` +
        `${sample.score.fullTime.home}-${sample.score.fullTime.away}`
    );
  }

  console.log(
    "\nNota: la web NO llama a football-data.org directamente. Solo el job match-result-sync " +
      "escribe en Firestore. Si esta API falla, los grupos no se cierran en DB aunque FIFA ya jugó."
  );
}

async function runFirestoreDiagnostic() {
  section("3) Firestore — estado real de grupos y R32");

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey || privateKey.includes("replace-me")) {
    console.log("⏭️  Saltado: credenciales Firebase no configuradas en .env");
    return;
  }

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n")
      })
    });

  const db = getFirestore(app);
  const snap = await db.collection("matches").get();

  type Row = {
    stage: string;
    status: string;
    homeScore90: number | null;
    awayScore90: number | null;
    homeTeamId: string | null;
    awayTeamId: string | null;
  };

  const rows = snap.docs.map((doc) => doc.data() as Row);
  const group = rows.filter((m) => m.stage === "group");
  const r32 = rows.filter((m) => m.stage === "R32");

  const groupWithScores = group.filter((m) => m.homeScore90 !== null && m.awayScore90 !== null);
  const groupFinished = group.filter((m) => m.status === "finished");
  const r32Hydrated = r32.filter((m) => m.homeTeamId && m.awayTeamId);
  const r32EditableCandidates = r32.filter(
    (m) => m.homeTeamId && m.awayTeamId && m.status === "scheduled"
  );

  console.log(`Project: ${projectId}`);
  console.log(`Matches total: ${rows.length}`);
  console.log(`\nGrupos (${group.length}):`);
  console.log(`  con homeScore90/awayScore90: ${groupWithScores.length}/${group.length}`);
  console.log(`  status finished: ${groupFinished.length}/${group.length}`);
  console.log(`\nR32 (${r32.length}):`);
  console.log(`  hidratados (home+away teamId): ${r32Hydrated.length}/${r32.length}`);
  console.log(`  scheduled con equipos (candidatos a predecir): ${r32EditableCandidates.length}`);

  const groups = await loadHydrationGroups();
  const hydrationInput: HydrationMatch[] = snap.docs.map((doc) => {
    const m = doc.data() as HydrationMatch & { matchId: string };
    return {
      matchId: doc.id,
      stage: m.stage,
      officialMatchNumber: m.officialMatchNumber,
      groupId: m.groupId ?? null,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeSlot: m.homeSlot ?? null,
      awaySlot: m.awaySlot ?? null,
      homeScore90: m.homeScore90,
      awayScore90: m.awayScore90,
      winnerTeamId: m.winnerTeamId ?? null,
      status: m.status
    };
  });

  const plan = planFullHydration(hydrationInput, groups);
  console.log("\nplanFullHydration sobre Firestore actual:");
  console.log(`  groupMatchesFinalized: ${plan.groupMatchesFinalized}/${plan.groupMatchesTotal}`);
  console.log(`  phaseUnlocks.r32: ${plan.phaseUnlocks.r32}`);
  console.log(`  patches pendientes (R32+): ${plan.allPatches.length}`);
  console.log(`  unresolvedSlots: ${plan.unresolvedSlots.length ? plan.unresolvedSlots.slice(0, 8).join(", ") : "(ninguno)"}`);

  console.log("\n--- Diagnóstico ---");
  if (plan.groupMatchesFinalized < plan.groupMatchesTotal) {
    console.log(
      "🔴 CAUSA PROBABLE A: faltan marcadores de grupo en Firestore → sync football-data " +
        "no llegó o falló emparejamiento de equipos."
    );
  } else if (plan.phaseUnlocks.r32 && r32Hydrated.length < r32.length) {
    console.log(
      "🔴 CAUSA PROBABLE B: grupos cerrados pero bracket-hydration no corrió / falló. " +
        "Correr JOB_NAME=bracket-hydration manualmente."
    );
  } else if (r32Hydrated.length === r32.length) {
    console.log("🟢 R32 hidratado en DB. Si la UI sigue bloqueada, revisar deadline T-60min por partido.");
  } else {
    console.log("🟡 Estado mixto — revisar unresolvedSlots y partidos de grupo sin score.");
  }
}

async function main() {
  console.log("\nDiagnóstico R32 unlock (16vos) — read-only\n");

  await runPureLogicDiagnostic();
  await runFootballDataDiagnostic();
  await runFirestoreDiagnostic();

  section("Próximos pasos sugeridos");
  console.log("1. Copiar .env.example → .env y completar Firebase + FOOTBALL_DATA_API_KEY");
  console.log("2. Re-correr: npx tsx scripts/ops/diagnose-r32-unlock.ts");
  console.log("3. Levantar local: pnpm dev:setup && pnpm dev");
  console.log("4. Probar sync local: pnpm --filter @prode/jobs sync:matches");
  console.log("5. Probar hidratación: JOB_NAME=bracket-hydration pnpm --filter @prode/jobs dev");
}

main().catch((error) => {
  console.error("DIAGNOSE FAILED:", error);
  process.exit(1);
});
