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

export type TournamentProjectionResponse = {
  mode: TournamentMode;
  groups: TuMundialGroupCard[];
  bracket: TournamentProjectionBracket;
  readiness: TournamentProjectionReadiness;
  updatedAt: string;
};
