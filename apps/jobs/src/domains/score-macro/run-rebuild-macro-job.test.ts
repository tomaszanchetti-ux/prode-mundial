import assert from "node:assert/strict";
import { test } from "node:test";

test("runRebuildMacroJob requires TOURNAMENT_ID", async () => {
  const previousTournamentId = process.env.TOURNAMENT_ID;
  delete process.env.TOURNAMENT_ID;

  try {
    const { runRebuildMacroJob } = await import("./run-rebuild-macro-job");

    await assert.rejects(() => runRebuildMacroJob(), /TOURNAMENT_ID/);
  } finally {
    if (previousTournamentId) {
      process.env.TOURNAMENT_ID = previousTournamentId;
    }
  }
});
