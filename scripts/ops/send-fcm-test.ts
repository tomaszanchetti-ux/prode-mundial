/**
 * Smoke test: manda una push notification FCM al token recibido por argumento.
 *
 * Uso: npx tsx scripts/ops/send-fcm-test.ts <fcm-token> [mensaje opcional]
 * Requiere: variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY en .env (root del repo)
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
    })
  });

const [, , tokenArg, ...bodyParts] = process.argv;

if (!tokenArg) {
  console.error("Uso: npx tsx scripts/ops/send-fcm-test.ts <fcm-token> [mensaje opcional]");
  process.exit(1);
}

const body = bodyParts.length > 0 ? bodyParts.join(" ") : "Smoke test FCM — si ves esto, el pipeline funciona end-to-end.";

async function main() {
  const response = await getMessaging(app).send({
    token: tokenArg,
    notification: {
      title: "Prode Mundial — test",
      body
    },
    data: {
      url: "/",
      tag: "smoke-test"
    },
    webpush: {
      fcmOptions: { link: "/" }
    }
  });

  console.log("✅ Enviado. Message ID:", response);
}

main().catch((error) => {
  console.error("❌ Error:", error?.errorInfo ?? error);
  process.exit(1);
});
