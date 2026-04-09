import type { MATCH_LIST_FILTERS, MATCH_PREDICTION_ERROR_CODES, MATCH_SCORING_RULES, MATCH_STAGES, MATCH_STATUSES, PREDICTION_STATUSES } from "../constants/matches";

export type MatchStage = (typeof MATCH_STAGES)[number];

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export type PredictionStatus = (typeof PREDICTION_STATUSES)[number];

export type MatchListFilter = (typeof MATCH_LIST_FILTERS)[number];

export type MatchPredictionErrorCode = (typeof MATCH_PREDICTION_ERROR_CODES)[number];

export type TeamRef = {
  teamId: string;
  name: string;
  flagUrl: string | null;
};

export type UserPredictionSummary = string | null;

export type MatchSummary = {
  matchId: string;
  stage: MatchStage;
  groupId: string | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  kickoffAt: string;
  predictionOpensAt: string;
  status: MatchStatus;
  deadlineAt: string;
  isLocked: boolean;
  isFinished: boolean;
  isScored: boolean;
  predictionStatus: PredictionStatus;
  userPredictionSummary: UserPredictionSummary;
  isEditable: boolean;
  ctaLabel: string;
};

export type MatchOfficialResult = {
  homeScore90: number;
  awayScore90: number;
  qualifiedTeamId: string | null;
  status: MatchStatus;
};

export type MatchPredictionScoringBreakdown = {
  exact90Hit: boolean;
  correctOutcome90Hit: boolean;
  correctQualifierHit: boolean;
  pointsExact90: number;
  pointsOutcome90: number;
  pointsQualifier: number;
  pointsTotal: number;
};

export type UserMatchPrediction = {
  predictionId: string;
  homeScorePred: number;
  awayScorePred: number;
  predictedQualifierTeamId: string | null;
  status: PredictionStatus;
  pointsAwarded: number | null;
  submittedAt: string;
  updatedAt: string;
  scoringBreakdown?: MatchPredictionScoringBreakdown;
};

export type MatchScoringRules = typeof MATCH_SCORING_RULES;

export type MatchDetail = MatchSummary & {
  requiresQualifierIfDraw: boolean;
  officialResult: MatchOfficialResult | null;
  userPrediction: UserMatchPrediction | null;
  scoringRules: MatchScoringRules;
};

export type ListMatchesQuery = {
  stage?: MatchStage;
  filter?: MatchListFilter;
  cursor?: string;
  limit?: number;
};

export type ListMatchesResponse = {
  items: MatchSummary[];
  nextCursor: string | null;
};

export type SaveMatchPredictionInput = {
  homeScorePred: number;
  awayScorePred: number;
  predictedQualifierTeamId?: string | null;
};

export type SaveMatchPredictionResponse = {
  predictionId: string;
  matchId: string;
  status: PredictionStatus;
  isEditable: boolean;
  homeScorePred: number;
  awayScorePred: number;
  predictedQualifierTeamId: string | null;
  savedAt: string;
};
