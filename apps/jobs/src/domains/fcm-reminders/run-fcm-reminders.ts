import { fcmReminderMatchesRepository } from "./repositories/matches-repository";
import { fcmReminderPredictionsRepository } from "./repositories/predictions-repository";
import { fcmReminderTokensRepository } from "./repositories/fcm-tokens-repository";
import { buildUserReminderPlans, resolveReminderWindow } from "./services/reminders-planner";
import { sendPlanWithMessaging } from "./services/messaging-sender";
import type { FcmRemindersExecutionSummary } from "./types";

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function runFcmReminders(now = new Date()): Promise<FcmRemindersExecutionSummary> {
  const windowStartHours = parseIntEnv("FCM_REMINDER_WINDOW_START_HOURS", 20);
  const windowEndHours = parseIntEnv("FCM_REMINDER_WINDOW_END_HOURS", 28);
  const window = resolveReminderWindow(now, windowStartHours, windowEndHours);

  const matches = await fcmReminderMatchesRepository.listMatchesInWindow(window);

  if (matches.length === 0) {
    return {
      window,
      matchesInWindow: 0,
      eligibleUsers: 0,
      tokensTargeted: 0,
      sent: 0,
      invalidTokensDeleted: 0,
      errors: 0
    };
  }

  const matchIds = matches.map((match) => match.matchId);
  const [predictions, tokens] = await Promise.all([
    fcmReminderPredictionsRepository.listPredictionsForMatches(matchIds),
    fcmReminderTokensRepository.listAllTokens()
  ]);

  const plans = buildUserReminderPlans(matches, predictions, tokens);

  let sent = 0;
  let invalidTokensDeleted = 0;
  let errors = 0;
  let tokensTargeted = 0;

  for (const plan of plans) {
    tokensTargeted += plan.tokens.length;
    const outcomes = await sendPlanWithMessaging(plan);

    for (const outcome of outcomes) {
      if (outcome.status === "sent") {
        sent += 1;
        continue;
      }

      if (outcome.status === "invalid-token") {
        await fcmReminderTokensRepository.deleteToken(outcome.userId, outcome.tokenId);
        invalidTokensDeleted += 1;
        continue;
      }

      errors += 1;
      console.warn(
        JSON.stringify({
          scope: "fcm-reminders",
          userId: outcome.userId,
          tokenId: outcome.tokenId,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage
        })
      );
    }
  }

  return {
    window,
    matchesInWindow: matches.length,
    eligibleUsers: plans.length,
    tokensTargeted,
    sent,
    invalidTokensDeleted,
    errors
  };
}
