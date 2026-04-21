import { getMessaging } from "firebase-admin/messaging";
import type { SendOutcome, UserReminderPlan } from "../types";
import { buildReminderCopy } from "./reminders-planner";

const INVALID_TOKEN_ERROR_CODES = new Set<string>([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument"
]);

export function isInvalidTokenError(errorCode: string | null | undefined): boolean {
  if (!errorCode) return false;
  return INVALID_TOKEN_ERROR_CODES.has(errorCode);
}

export async function sendPlanWithMessaging(plan: UserReminderPlan): Promise<SendOutcome[]> {
  const copy = buildReminderCopy(plan.pendingMatchCount);
  const outcomes: SendOutcome[] = [];

  for (const target of plan.tokens) {
    try {
      await getMessaging().send({
        token: target.token,
        notification: {
          title: copy.title,
          body: copy.body
        },
        data: {
          url: "/matches",
          pendingCount: String(plan.pendingMatchCount),
          tag: "prode-reminder"
        }
      });

      outcomes.push({
        userId: plan.userId,
        tokenId: target.tokenId,
        token: target.token,
        status: "sent"
      });
    } catch (error) {
      const errorCode = (error as { code?: string } | null)?.code ?? null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const invalid = isInvalidTokenError(errorCode);

      outcomes.push({
        userId: plan.userId,
        tokenId: target.tokenId,
        token: target.token,
        status: invalid ? "invalid-token" : "error",
        errorCode: errorCode ?? undefined,
        errorMessage
      });
    }
  }

  return outcomes;
}
