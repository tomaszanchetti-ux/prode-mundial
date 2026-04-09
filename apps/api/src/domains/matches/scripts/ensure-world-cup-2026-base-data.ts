import "../../../env";

import { collectionsHaveWorldCupBaseData, seedWorldCup2026 } from "./world-cup-2026-seed-lib";

async function main() {
  const status = await collectionsHaveWorldCupBaseData();
  const isReady = status.matches && status.teams && status.groups;

  console.log(
    JSON.stringify(
      {
        ok: true,
        collections: status,
        action: isReady ? "skip" : "seed"
      },
      null,
      2
    )
  );

  if (isReady) {
    console.log("World Cup 2026 base data already present. Skipping seed.");
    return;
  }

  const result = await seedWorldCup2026();
  console.log(`Ensured base data: ${result.counts.teams} teams, ${result.counts.groups} groups and ${result.counts.matches} matches.`);
}

main().catch((error: unknown) => {
  console.error("Failed to ensure World Cup 2026 base data.");
  console.error(error);
  process.exitCode = 1;
});
