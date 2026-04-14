import "./env";
import { runMatchLockEnforcement } from "./domains/match-lock/run-match-lock-enforcement";
import { runMatchSync } from "./domains/match-sync/run-match-sync";
import { runRebuildMacroJob } from "./domains/score-macro/run-rebuild-macro-job";
import { runScoreMacroJob } from "./domains/score-macro/run-score-macro-job";

const jobName = process.env.JOB_NAME ?? "match-lock-enforcement";

async function main() {
  if (jobName === "match-lock-enforcement") {
    const summary = await runMatchLockEnforcement();
    console.log(
      JSON.stringify({
        ok: true,
        jobName,
        summary
      })
    );
    return;
  }

  if (jobName === "score-macro") {
    const summary = await runScoreMacroJob();
    console.log(
      JSON.stringify({
        ok: true,
        jobName,
        summary
      })
    );
    return;
  }

  if (jobName === "match-result-sync") {
    const summary = await runMatchSync();
    console.log(
      JSON.stringify({
        ok: true,
        jobName,
        summary
      })
    );
    return;
  }

  if (jobName === "rebuild-macro") {
    const summary = await runRebuildMacroJob();
    console.log(
      JSON.stringify({
        ok: true,
        jobName,
        summary
      })
    );
    return;
  }

  throw new Error(`Unsupported JOB_NAME: ${jobName}`);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      jobName,
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exitCode = 1;
});
