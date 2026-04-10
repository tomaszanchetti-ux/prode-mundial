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
  flagUrl: string | null;
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
};

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
