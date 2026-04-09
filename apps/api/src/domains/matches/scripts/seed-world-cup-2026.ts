import "../../../env";
import { buildWorldCup2026SeedSummary, seedWorldCup2026 } from "./world-cup-2026-seed-lib";

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const nowIso = new Date().toISOString();
  const { summary } = buildWorldCup2026SeedSummary(nowIso);

  console.log(JSON.stringify(summary, null, 2));

  if (dryRun) {
    console.log("Dry run completed. No Firestore writes executed.");
    return;
  }

  const result = await seedWorldCup2026(nowIso);
  console.log(`Seeded ${result.counts.teams} teams, ${result.counts.groups} groups and ${result.counts.matches} matches.`);
}

main().catch((error: unknown) => {
  console.error("Failed to seed World Cup 2026 base data.");
  console.error(error);
  process.exitCode = 1;
});
