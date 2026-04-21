import "../../../env";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

async function run(scriptName: string, args: string[] = []) {
  const cwd = fileURLToPath(new URL("../../../../..", import.meta.url));
  const scriptPath = fileURLToPath(new URL(`./${scriptName}`, import.meta.url));

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", scriptPath, ...args], {
      cwd,
      env: process.env,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptName} exited with code ${code ?? "unknown"}.`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const passthroughArgs = process.argv.slice(2);
  await run("reset-competition-demo.ts", passthroughArgs);
  await run("seed-competition-demo.ts", passthroughArgs);
}

main().catch((error: unknown) => {
  console.error("Failed to rebuild competition demo.");
  console.error(error);
  process.exitCode = 1;
});
