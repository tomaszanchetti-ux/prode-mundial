import "../../../env";
import { firestore } from "../../../server/firebase/firebase-admin";

/**
 * Resetea el estado Stripe (`plan`, `goldUpgradedAt`, `stripeCustomerId`) de
 * usuarios que pasaron a Gold via test mode, para evitar customer IDs huérfanos
 * cuando la cuenta de Stripe pase a Live. Test y Live son namespaces separados,
 * los `cus_xxx` test no existen en Live.
 *
 * Uso:
 *   pnpm --filter @prode/api reset:stripe-test                    # dry-run por default
 *   pnpm --filter @prode/api reset:stripe-test --apply            # ejecuta los writes
 *   pnpm --filter @prode/api reset:stripe-test --user-id=usr_xxx  # solo ese user
 *   pnpm --filter @prode/api reset:stripe-test --apply --user-id=usr_xxx
 *
 * Idempotente: correr 2 veces deja el mismo estado.
 */

type ResetTarget = {
  userId: string;
  email: string | null;
  currentPlan: string;
  currentStripeCustomerId: string | null;
};

async function findResetTargets(filterUserId: string | null): Promise<ResetTarget[]> {
  if (filterUserId) {
    const snapshot = await firestore.collection("users").doc(filterUserId).get();
    if (!snapshot.exists) {
      return [];
    }
    const data = snapshot.data() as Record<string, unknown>;
    return [
      {
        userId: filterUserId,
        email: (data.email as string | null | undefined) ?? null,
        currentPlan: (data.plan as string | undefined) ?? "free",
        currentStripeCustomerId: (data.stripeCustomerId as string | null | undefined) ?? null
      }
    ];
  }

  // Sin filtro: levantamos cualquier user que tenga plan=gold OR algún rastro
  // Stripe en el doc (cubre el caso de un upgrade fallido a mitad de webhook).
  const goldSnapshot = await firestore.collection("users").where("plan", "==", "gold").get();
  const goldUsers = goldSnapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      userId: doc.id,
      email: (data.email as string | null | undefined) ?? null,
      currentPlan: "gold",
      currentStripeCustomerId: (data.stripeCustomerId as string | null | undefined) ?? null
    };
  });

  const stripeOnlySnapshot = await firestore
    .collection("users")
    .where("stripeCustomerId", "!=", null)
    .get();
  const seenUserIds = new Set(goldUsers.map((target) => target.userId));
  const stripeOnlyUsers = stripeOnlySnapshot.docs
    .filter((doc) => !seenUserIds.has(doc.id))
    .map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        userId: doc.id,
        email: (data.email as string | null | undefined) ?? null,
        currentPlan: (data.plan as string | undefined) ?? "free",
        currentStripeCustomerId: (data.stripeCustomerId as string | null | undefined) ?? null
      };
    });

  return [...goldUsers, ...stripeOnlyUsers];
}

async function resetUser(userId: string): Promise<void> {
  await firestore.collection("users").doc(userId).update({
    plan: "free",
    goldUpgradedAt: null,
    stripeCustomerId: null,
    updatedAt: new Date().toISOString()
  });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const filterUserId =
    process.argv.find((argument) => argument.startsWith("--user-id="))?.split("=")[1]?.trim() ?? null;

  const targets = await findResetTargets(filterUserId);

  if (targets.length === 0) {
    console.log(
      JSON.stringify(
        {
          mode: apply ? "apply" : "dry-run",
          filterUserId,
          message: "No users with plan=gold or stripeCustomerId set. Nothing to do.",
          touched: 0
        },
        null,
        2
      )
    );
    return;
  }

  if (apply) {
    for (const target of targets) {
      await resetUser(target.userId);
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        filterUserId,
        touched: apply ? targets.length : 0,
        wouldTouch: apply ? 0 : targets.length,
        targets: targets.map((target) => ({
          userId: target.userId,
          email: target.email,
          before: {
            plan: target.currentPlan,
            stripeCustomerId: target.currentStripeCustomerId
          },
          after: {
            plan: "free",
            goldUpgradedAt: null,
            stripeCustomerId: null
          }
        }))
      },
      null,
      2
    )
  );

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to persist these changes.");
  }
}

main().catch((error: unknown) => {
  console.error("Failed to reset Stripe test state.");
  console.error(error);
  process.exitCode = 1;
});
