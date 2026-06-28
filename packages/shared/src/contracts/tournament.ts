import type { MatchStage, TeamIdentity, TeamRef } from "./matches";

export type TournamentMode = "pre_tournament" | "live_tournament";

export type PreTournamentSummary = {
  isPreTournament: boolean;
  completedMatches: number;
  totalMatches: number;
  remainingMatches: number;
  completionPercentage: number;
  nextPendingMatchId: string | null;
};

export type PredictedGroupStandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  isProjectedQualified: boolean;
} & TeamIdentity;

export type TuMundialGroupCard = {
  groupId: string;
  groupName: string;
  completedMatches: number;
  totalMatches: number;
  isComplete: boolean;
  items: PredictedGroupStandingRow[];
};

export type TuMundialResponse = {
  mode: TournamentMode;
  groups: TuMundialGroupCard[];
  updatedAt: string;
};

export type TournamentProjectionSide = {
  team: TeamRef | null;
  slot: string;
  slotLabel: string;
};

export type TournamentProjectionMatchSource = "anchored" | "projected" | "unresolved";

export type TournamentProjectionMatch = {
  matchId: string;
  officialMatchNumber: number;
  stage: MatchStage;
  kickoffAt: string;
  kickoffAtEt: string | null;
  venueId: string | null;
  home: TournamentProjectionSide;
  away: TournamentProjectionSide;
  winnerTeamId: string | null;
  source: TournamentProjectionMatchSource;
  // Overlay de resultado oficial + predicción (lo puebla el bracket oficial de
  // /world-cup desde MatchSummary; la simulación de /tournament los omite).
  homeScore90?: number | null;
  awayScore90?: number | null;
  userPredictionSummary?: string | null;
  userPredictionPoints?: number | null;
  isScored?: boolean;
};

export type TournamentProjectionBracket = {
  round32: TournamentProjectionMatch[];
  round16: TournamentProjectionMatch[];
  quarterfinals: TournamentProjectionMatch[];
  semifinals: TournamentProjectionMatch[];
  bronze: TournamentProjectionMatch[];
  final: TournamentProjectionMatch[];
};

export type TournamentProjectionReadiness = {
  groupMatchesTotal: number;
  groupMatchesWithPrediction: number;
  isGroupsComplete: boolean;
  unresolvedSlots: string[];
};

/**
 * Which prediction phases the user is allowed to fill in. Derived from the
 * official hydration plan: each phase unlocks once the upstream round has
 * fully closed (every match has a winnerTeamId).
 */
export type TournamentPhaseUnlocks = {
  groups: true;
  r32: boolean;
  r16: boolean;
  qf: boolean;
  sf: boolean;
  bronzeFinal: boolean;
};

export type TournamentProjectionResponse = {
  mode: TournamentMode;
  groups: TuMundialGroupCard[];
  bracket: TournamentProjectionBracket;
  readiness: TournamentProjectionReadiness;
  phaseUnlocks: TournamentPhaseUnlocks;
  updatedAt: string;
};
