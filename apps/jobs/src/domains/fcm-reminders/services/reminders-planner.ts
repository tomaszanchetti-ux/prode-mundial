import type {
  ReminderStoredMatch,
  ReminderStoredPrediction,
  ReminderStoredToken,
  ReminderWindow,
  UserReminderPlan
} from "../types";

const DEFAULT_WINDOW_START_HOURS = 20;
const DEFAULT_WINDOW_END_HOURS = 28;

export function resolveReminderWindow(
  now: Date,
  startHours = DEFAULT_WINDOW_START_HOURS,
  endHours = DEFAULT_WINDOW_END_HOURS
): ReminderWindow {
  if (endHours <= startHours) {
    throw new Error("endHours must be greater than startHours");
  }

  const start = new Date(now.getTime() + startHours * 60 * 60 * 1000);
  const end = new Date(now.getTime() + endHours * 60 * 60 * 1000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

export function filterMatchesInWindow(
  matches: ReminderStoredMatch[],
  window: ReminderWindow
): ReminderStoredMatch[] {
  return matches.filter((match) => match.kickoffAt >= window.startIso && match.kickoffAt < window.endIso);
}

export function buildUserReminderPlans(
  matchesInWindow: ReminderStoredMatch[],
  predictions: ReminderStoredPrediction[],
  tokens: ReminderStoredToken[]
): UserReminderPlan[] {
  if (matchesInWindow.length === 0 || tokens.length === 0) {
    return [];
  }

  const matchIdSet = new Set(matchesInWindow.map((match) => match.matchId));

  const predictedPairs = new Set<string>();
  for (const prediction of predictions) {
    if (matchIdSet.has(prediction.matchId)) {
      predictedPairs.add(`${prediction.userId}|${prediction.matchId}`);
    }
  }

  const tokensByUser = new Map<string, Array<{ tokenId: string; token: string }>>();
  for (const token of tokens) {
    const list = tokensByUser.get(token.userId) ?? [];
    list.push({ tokenId: token.tokenId, token: token.token });
    tokensByUser.set(token.userId, list);
  }

  const plans: UserReminderPlan[] = [];

  for (const [userId, userTokens] of tokensByUser) {
    let pendingCount = 0;

    for (const match of matchesInWindow) {
      if (!predictedPairs.has(`${userId}|${match.matchId}`)) {
        pendingCount += 1;
      }
    }

    if (pendingCount > 0) {
      plans.push({
        userId,
        pendingMatchCount: pendingCount,
        tokens: userTokens
      });
    }
  }

  return plans;
}

export function buildReminderCopy(pendingMatchCount: number): { title: string; body: string } {
  const title = "Prode Mundial — recordatorio";

  if (pendingMatchCount === 1) {
    return { title, body: "Te falta 1 predicción para mañana. Cargala antes del kickoff." };
  }

  return {
    title,
    body: `Te faltan ${pendingMatchCount} predicciones para mañana. Cargalas antes del kickoff.`
  };
}
