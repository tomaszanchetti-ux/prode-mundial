import type { MATCH_LIST_FILTERS, MATCH_PREDICTION_ERROR_CODES, MATCH_SCORING_RULES, MATCH_STAGES, MATCH_STATUSES, PREDICTION_STATUSES } from "../constants/matches";

export type MatchStage = (typeof MATCH_STAGES)[number];

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export type PredictionStatus = (typeof PREDICTION_STATUSES)[number];

export type MatchListFilter = (typeof MATCH_LIST_FILTERS)[number];

export type MatchPredictionErrorCode = (typeof MATCH_PREDICTION_ERROR_CODES)[number];

export type TeamIdentity = {
  fifaCode: string | null;
  iso2: string | null;
  iso3: string | null;
  flagAsset: string | null;
  flagUrl: string | null;
};

export type TeamRef = {
  teamId: string;
  name: string;
} & TeamIdentity;

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
  userPredictionPoints: number | null;
  isEditable: boolean;
  ctaLabel: string;
  homeScore90: number | null;
  awayScore90: number | null;
  // Bracket metadata del SOT oficial. Expuestos para que consumers (ej. /world-cup)
  // puedan armar bracket visuals sin consultas adicionales. Null para matches
  // legacy sin seed oficial (fuera del World Cup 2026).
  officialMatchNumber: number | null;
  homeSlot: string | null;
  awaySlot: string | null;
  // Ganador oficial para resolver empates 90' en knockouts (penales). Null si el
  // match no terminó o es de grupos (empate válido sin ganador).
  winnerTeamId: string | null;
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
  pointsExact90: number;
  pointsOutcome90: number;
  pointsTotal: number;
};

export type UserMatchPrediction = {
  predictionId: string;
  homeScorePred: number;
  awayScorePred: number;
  status: PredictionStatus;
  pointsAwarded: number | null;
  submittedAt: string;
  updatedAt: string;
  scoringBreakdown?: MatchPredictionScoringBreakdown;
};

export type MatchScoringRules = typeof MATCH_SCORING_RULES;

export type MatchDetail = MatchSummary & {
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
  advancesTeamPred?: string | null;
};

export type SaveMatchPredictionResponse = {
  predictionId: string;
  matchId: string;
  status: PredictionStatus;
  isEditable: boolean;
  homeScorePred: number;
  awayScorePred: number;
  savedAt: string;
};
