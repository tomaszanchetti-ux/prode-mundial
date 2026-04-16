export type StoredChampionPick = {
  userId: string;
  championTeamId: string | null;
  adjustedChampionTeamId: string | null;
  isLocked: boolean;
  isAdjusted: boolean;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  adjustedAt: string | null;
};

export type StoredChampionScoringLog = {
  userId: string;
  tournamentId: string;
  totalPoints: number;
  championPoints: number;
  wasAdjusted: boolean;
  scoredAt: string;
};

export type StoredChampionResult = {
  tournamentId: string;
  championTeamId: string;
  updatedAt: string;
};
