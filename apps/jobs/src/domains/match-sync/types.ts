export type SyncStoredMatch = {
  matchId: string;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  kickoffAt: string;
  status: "scheduled" | "live" | "finished" | "corrected";
  homeScore90: number | null;
  awayScore90: number | null;
  winnerTeamId: string | null;
  isLocked: boolean;
  isScored: boolean;
  sourceProvider?: string | null;
  sourceLastSyncedAt?: string | null;
  updatedAt: string;
};

export type SyncStoredPrediction = {
  predictionId: string;
  userId: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  predictedQualifierTeamId?: string | null;
  isLocked: boolean;
  isScored: boolean;
  pointsAwarded: number;
  scoringBreakdown: {
    exact90Points: number;
    outcome90Points: number;
    qualifierPoints: number;
    totalPoints: number;
  } | null;
  scoredAt?: string | null;
  updatedAt: string;
};

export type MatchSyncExecutionSummary = {
  syncedAt: string;
  externalMatchesFetched: number;
  matchesUpdated: number;
  matchesScored: number;
  skipped: Array<{ externalId: number; reason: string }>;
  errors: Array<{ matchId: string; error: string }>;
};
