import "./env";
import { runMatchLockEnforcement } from "./domains/match-lock/run-match-lock-enforcement";

const jobName = process.env.JOB_NAME ?? "match-lock-enforcement";

async function main() {
  if (jobName !== "match-lock-enforcement") {
    throw new Error(`Unsupported JOB_NAME: ${jobName}`);
  }

  const summary = await runMatchLockEnforcement();
  console.log(
    JSON.stringify({
      ok: true,
      jobName,
      summary
    })
  );
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
