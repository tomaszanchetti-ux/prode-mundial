import "../../../env";
import { readFile } from "node:fs/promises";
import { championResultSchema } from "@prode/shared";
import { rebuildMacroScoring } from "../services/score-macro-batch";

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function loadChampionFromFile(filePath: string): Promise<string> {
  const raw = await readFile(filePath, "utf8");
  const parsed = championResultSchema.parse(JSON.parse(raw));
  return parsed.championTeamId;
}

async function main() {
  const tournamentId = getArg("tournamentId");

  if (!tournamentId) {
    throw new Error("Missing required argument --tournamentId=<id>.");
  }

  const resultsFile = getArg("resultsFile");
  const champion = resultsFile ? await loadChampionFromFile(resultsFile) : undefined;
  const summary = await rebuildMacroScoring(tournamentId, champion);

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Failed to rebuild champion scoring.");
  console.error(error);
  process.exitCode = 1;
});
