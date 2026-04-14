import assert from "node:assert/strict";
import { test } from "node:test";

test("runScoreMacroJob requires TOURNAMENT_ID", async () => {
  const previousTournamentId = process.env.TOURNAMENT_ID;
  delete process.env.TOURNAMENT_ID;

  try {
    const { runScoreMacroJob } = await import("./run-score-macro-job");

    await assert.rejects(() => runScoreMacroJob(), /TOURNAMENT_ID/);
  } finally {
    if (previousTournamentId) {
      process.env.TOURNAMENT_ID = previousTournamentId;
    }
  }
});
