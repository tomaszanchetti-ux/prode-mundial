import "../../../env";
import { readFile } from "node:fs/promises";
import { macroTournamentResultsSchema, type MacroTournamentResults } from "@prode/shared";
import { scoreMacroBatch } from "../services/score-macro-batch";

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function loadResultsFromFile(filePath: string): Promise<MacroTournamentResults> {
  const raw = await readFile(filePath, "utf8");
  return macroTournamentResultsSchema.parse(JSON.parse(raw));
}

async function main() {
  const tournamentId = getArg("tournamentId");

  if (!tournamentId) {
    throw new Error("Missing required argument --tournamentId=<id>.");
  }

  const resultsFile = getArg("resultsFile");
  const results = resultsFile ? await loadResultsFromFile(resultsFile) : undefined;
  const summary = await scoreMacroBatch(tournamentId, results);

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main().catch((error: unknown) => {
  console.error("Failed to score macro predictions.");
  console.error(error);
  process.exitCode = 1;
});
