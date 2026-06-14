import type { MatchStage, MatchStatus, TeamRef } from "./matches";
import type { FullGroupStandings } from "../tournament/official-standings";

/**
 * Public, login-free projections of tournament data. These power the
 * indexable SSR content hub (fixtures, results, group tables, team pages)
 * served on prodemundial.org. They intentionally carry ZERO user-specific
 * fields (no predictions, points, CTA labels or league data) so the payloads
 * are safe to cache at the edge and expose to anonymous crawlers.
 */

export type PublicMatch = {
  matchId: string;
  officialMatchNumber: number | null;
  stage: MatchStage;
  groupId: string | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeSlot: string | null;
  awaySlot: string | null;
  kickoffAt: string;
  status: MatchStatus;
  homeScore90: number | null;
  awayScore90: number | null;
  winnerTeamId: string | null;
};

export type PublicMatchListResponse = {
  items: PublicMatch[];
};

export type PublicMatchDetail = PublicMatch;

export type PublicTeam = {
  teamId: string;
  fifaCode: string;
  iso2: string | null;
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupId: string | null;
};

export type PublicTeamListResponse = {
  items: PublicTeam[];
};

export type PublicStandingsResponse = {
  groups: FullGroupStandings[];
};
