import "../../../env";
import { readFile } from "node:fs/promises";
import { championResultSchema } from "@prode/shared";
import { championResultsRepository } from "../repositories/macro-results-repository";

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function main() {
  const tournamentId = getArg("tournamentId");
  const resultsFile = getArg("resultsFile");

  if (!tournamentId) {
    throw new Error("Missing required argument --tournamentId=<id>.");
  }

  if (!resultsFile) {
    throw new Error("Missing required argument --resultsFile=<path>.");
  }

  const raw = await readFile(resultsFile, "utf8");
  const result = championResultSchema.parse(JSON.parse(raw));

  await championResultsRepository.upsert({
    tournamentId,
    championTeamId: result.championTeamId,
    updatedAt: new Date().toISOString()
  });

  console.log(JSON.stringify({ ok: true, tournamentId, updated: true }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Failed to upsert champion results.");
  console.error(error);
  process.exitCode = 1;
});
