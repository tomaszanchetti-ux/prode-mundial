import type { UserPointsSummary } from "@prode/shared";

export type AggregatesLeagueMember = {
  membershipId: string;
  leagueId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
};

export type AggregatesLeagueStanding = UserPointsSummary & {
  leagueId: string;
  userId: string;
  displayName: string;
  position: number | null;
  isOwner: boolean;
  lastUpdatedAt: string;
  lastPointArrivalAt: string | null;
};

export type AggregatesChampionScoringLog = {
  userId: string;
  tournamentId: string;
  totalPoints: number;
};

export type AggregatesRebuildSummary = {
  usersRebuilt: number;
  leaguesRebuilt: number;
  errors: Array<{ scope: string; error: string }>;
};
