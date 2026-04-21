import "../../../env";
import { readFile } from "node:fs/promises";
import { bestPlayerResultSchema, isValidBestPlayerId } from "@prode/shared";
import { bestPlayerResultsRepository } from "../repositories/macro-results-repository";

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function main() {
  const tournamentId = getArg("tournamentId");
  const playerId = getArg("playerId");
  const resultsFile = getArg("resultsFile");

  if (!tournamentId) {
    throw new Error("Missing required argument --tournamentId=<id>.");
  }

  let bestPlayerId: string;

  if (playerId) {
    const parsed = bestPlayerResultSchema.parse({ bestPlayerId: playerId });
    bestPlayerId = parsed.bestPlayerId;
  } else if (resultsFile) {
    const raw = await readFile(resultsFile, "utf8");
    const parsed = bestPlayerResultSchema.parse(JSON.parse(raw));
    bestPlayerId = parsed.bestPlayerId;
  } else {
    throw new Error("Missing --playerId=<id> or --resultsFile=<path>.");
  }

  if (!isValidBestPlayerId(bestPlayerId)) {
    throw new Error(
      `playerId "${bestPlayerId}" is not in the BEST_PLAYER_ROSTER. Update shared roster first.`
    );
  }

  await bestPlayerResultsRepository.upsert({
    tournamentId,
    bestPlayerId,
    updatedAt: new Date().toISOString()
  });

  console.log(JSON.stringify({ ok: true, tournamentId, bestPlayerId }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Failed to upsert best-player result.");
  console.error(error);
  process.exitCode = 1;
});
