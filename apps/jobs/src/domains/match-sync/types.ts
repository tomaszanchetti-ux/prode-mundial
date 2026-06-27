export type SyncStoredMatch = {
  matchId: string;
  officialMatchNumber?: number;
  stage: string;
  groupId?: string | null;
  homeSlot?: string | null;
  awaySlot?: string | null;
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
  isLocked: boolean;
  isScored: boolean;
  pointsAwarded: number;
  scoringBreakdown: {
    exact90Points: number;
    outcome90Points: number;
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
  /** Partidos ya puntuados re-puntuados por una corrección de la fuente. */
  matchesCorrected?: number;
  skipped: Array<{ externalId: number; reason: string }>;
  errors: Array<{ matchId: string; error: string }>;
  groupMatchesFinalized?: number;
  bracketHydration?: {
    isR32Ready: boolean;
    groupMatchesTotal: number;
    groupMatchesFinalized: number;
    r32PatchesApplied: number;
    knockoutPatchesApplied: number;
    patchesApplied: number;
    phaseUnlocks: {
      groups: true;
      r32: boolean;
      r16: boolean;
      qf: boolean;
      sf: boolean;
      bronzeFinal: boolean;
    };
    unresolvedSlots: string[];
    appliedMatchIds: string[];
  };
  aggregatesRebuild?: {
    usersRebuilt: number;
    leaguesRebuilt: number;
    errors: Array<{ scope: string; error: string }>;
  };
};
