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
  /**
   * EPIC 19 Card 6 — logs macro unificados. Defaults a 0 para picks
   * escritos con versiones anteriores del batch. `totalPoints` suma los 3.
   */
  subChampionPoints?: number;
  bestPlayerPoints?: number;
};

export type StoredChampionResult = {
  tournamentId: string;
  championTeamId: string;
  updatedAt: string;
};

export type StoredSubChampionResult = {
  tournamentId: string;
  subChampionTeamId: string;
  updatedAt: string;
};

export type StoredBestPlayerResult = {
  tournamentId: string;
  bestPlayerId: string;
  updatedAt: string;
};

export type StoredSubChampionPick = {
  userId: string;
  subChampionTeamId: string | null;
  adjustedSubChampionTeamId: string | null;
  isLocked: boolean;
  isAdjusted: boolean;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  adjustedAt: string | null;
};

export type StoredBestPlayerPick = {
  userId: string;
  bestPlayerId: string | null;
  adjustedBestPlayerId: string | null;
  isLocked: boolean;
  isAdjusted: boolean;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  adjustedAt: string | null;
};
