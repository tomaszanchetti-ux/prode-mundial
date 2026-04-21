export async function runScoreMacroJob() {
  const tournamentId = process.env.TOURNAMENT_ID?.trim();

  if (!tournamentId) {
    throw new Error("Missing required environment variable: TOURNAMENT_ID");
  }

  const { scoreMacroBatch } = await import("../../../../api/src/domains/macro-picks/services/score-macro-batch");
  return scoreMacroBatch(tournamentId);
}
