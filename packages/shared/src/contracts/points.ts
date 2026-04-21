import type { MatchPredictionScoringBreakdown } from "./matches";

export type UserPointsSummary = {
  totalPoints: number;
  macroPoints: number;
  exactHits: number;
  correctSigns: number;
};

export type UserPointsTotals = UserPointsSummary & {
  matchPoints: number;
};

export type PointsByStage = {
  group: number;
  R32: number;
  R16: number;
  QF: number;
  SF: number;
  BRONZE: number;
  FINAL: number;
  macro: number;
};

export type RecentPointsEntry = {
  matchId: string;
  matchLabel: string;
  stageLabel: string;
  userPredictionSummary: string;
  officialResultSummary: string;
  points: number;
  scoredAt: string;
  breakdown: MatchPredictionScoringBreakdown;
};

export type PointsResponse = UserPointsSummary & {
  matchPoints: number;
  totals: UserPointsTotals;
  byStage: PointsByStage;
  recentMatches: RecentPointsEntry[];
};
