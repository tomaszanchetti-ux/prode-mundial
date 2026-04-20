export type ReminderStoredMatch = {
  matchId: string;
  kickoffAt: string;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "bronze-final" | "final" | string;
};

export type ReminderStoredPrediction = {
  predictionId: string;
  userId: string;
  matchId: string;
  isLocked: boolean;
};

export type ReminderStoredToken = {
  userId: string;
  tokenId: string;
  token: string;
};

export type ReminderWindow = {
  startIso: string;
  endIso: string;
};

export type UserReminderPlan = {
  userId: string;
  pendingMatchCount: number;
  tokens: Array<{ tokenId: string; token: string }>;
};

export type SendOutcome = {
  userId: string;
  tokenId: string;
  token: string;
  status: "sent" | "invalid-token" | "error";
  errorCode?: string;
  errorMessage?: string;
};

export type FcmRemindersExecutionSummary = {
  window: ReminderWindow;
  matchesInWindow: number;
  eligibleUsers: number;
  tokensTargeted: number;
  sent: number;
  invalidTokensDeleted: number;
  errors: number;
};
