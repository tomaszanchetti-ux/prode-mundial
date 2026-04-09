import type { MatchPredictionScoringBreakdown } from "./matches";

export type UserPointsSummary = {
  totalPoints: number;
  macroPoints: number;
  exactHits: number;
  correctSigns: number;
};

export type RecentPointsEntry = {
  matchId: string;
  matchLabel: string;
  stageLabel: string;
  points: number;
  scoredAt: string;
  breakdown: MatchPredictionScoringBreakdown;
};

export type PointsResponse = UserPointsSummary & {
  recentMatches: RecentPointsEntry[];
};

