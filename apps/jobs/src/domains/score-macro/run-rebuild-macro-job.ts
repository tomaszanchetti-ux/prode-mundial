export async function runRebuildMacroJob() {
  const tournamentId = process.env.TOURNAMENT_ID?.trim();

  if (!tournamentId) {
    throw new Error("Missing required environment variable: TOURNAMENT_ID");
  }

  const { rebuildMacroScoring } = await import("../../../../api/src/domains/macro-picks/services/score-macro-batch");
  return rebuildMacroScoring(tournamentId);
}
