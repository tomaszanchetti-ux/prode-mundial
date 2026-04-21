export type ChampionScoringBreakdown = {
  championPoints: number;
  wasAdjusted: boolean;
};

export type SubChampionScoringBreakdown = {
  subChampionPoints: number;
  wasAdjusted: boolean;
};

export type BestPlayerScoringBreakdown = {
  bestPlayerPoints: number;
  wasAdjusted: boolean;
};

export type ChampionScoringLog = {
  userId: string;
  tournamentId: string;
  totalPoints: number;
  breakdown: ChampionScoringBreakdown;
  scoredAt: string;
};
