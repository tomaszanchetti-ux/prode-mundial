export type ChampionScoringBreakdown = {
  championPoints: number;
  wasAdjusted: boolean;
};

export type ChampionScoringLog = {
  userId: string;
  tournamentId: string;
  totalPoints: number;
  breakdown: ChampionScoringBreakdown;
  scoredAt: string;
};
