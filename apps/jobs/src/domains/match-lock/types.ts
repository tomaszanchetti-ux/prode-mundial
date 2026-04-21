export type JobStoredMatch = {
  matchId: string;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished";
  isLocked: boolean;
};

export type JobStoredPrediction = {
  predictionId: string;
  matchId: string;
  isLocked: boolean;
  lockedAt?: string | null;
};

export type MatchLockPlan = {
  matchIds: string[];
  matchPatch: Pick<JobStoredMatch, "isLocked">;
  predictions: Array<{
    predictionId: string;
    patch: {
      isLocked: boolean;
      lockedAt: string;
    };
  }>;
};

export type MatchLockExecutionSummary = {
  scannedMatches: number;
  lockedMatches: number;
  lockedPredictions: number;
};
