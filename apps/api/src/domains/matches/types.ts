import type {
  ListMatchesQuery,
  MatchDetail,
  MatchStage,
  MatchStatus,
  MatchSummary,
  PredictionStatus,
  TeamRef,
  UserMatchPrediction
} from "@prode/shared";
import type { MatchFunctionalState, PredictionLifecycleState } from "./services/match-state";

export type StoredMatchStatus = MatchStatus | "corrected";

export type StoredTeam = {
  teamId: string;
  fifaCode: string;
  iso2: string | null;
  iso3: string | null;
  flagAsset: string | null;
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredMatch = {
  matchId: string;
  officialMatchNumber?: number;
  stage: MatchStage;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSlot?: string | null;
  awaySlot?: string | null;
  venueId?: string | null;
  kickoffAt: string;
  kickoffAtEt?: string | null;
  status: StoredMatchStatus;
  homeScore90: number | null;
  awayScore90: number | null;
  winnerTeamId: string | null;
  isLocked: boolean;
  isScored: boolean;
  sourceProvider?: string | null;
  sourceLastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredPredictionScoringBreakdown = {
  exact90Points: number;
  outcome90Points: number;
  qualifierPoints: number;
  totalPoints: number;
};

export type StoredPrediction = {
  predictionId: string;
  userId: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  predictedWinnerTeamId?: string | null;
  predictedQualifierTeamId?: string | null;
  isLocked: boolean;
  isScored: boolean;
  pointsAwarded: number;
  scoringBreakdown: StoredPredictionScoringBreakdown | null;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string | null;
  scoredAt?: string | null;
};

export type MatchesRepositoryListInput = Pick<ListMatchesQuery, "stage">;

export type MatchRowView = {
  match: StoredMatch;
  prediction: StoredPrediction | null;
  summary: MatchSummary;
};

export type MatchListView = {
  items: MatchSummary[];
  nextCursor: string | null;
};

export type MatchDetailView = {
  match: StoredMatch;
  prediction: StoredPrediction | null;
  detail: MatchDetail;
};

export type DerivedMatchViewState = {
  publicStatus: MatchStatus;
  matchState: MatchFunctionalState;
  predictionLifecycleState: PredictionLifecycleState | null;
  isLocked: boolean;
  isEditable: boolean;
  isFinished: boolean;
  isScored: boolean;
  requiresQualifierIfDraw: boolean;
  predictionStatus: PredictionStatus;
  userPredictionSummary: string | null;
  ctaLabel: string;
};

export type ResolvedMatchTeams = {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
};
