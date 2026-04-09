export type LeagueSummary = {
  leagueId: string;
  name: string;
  memberLimit: number;
  membersCount: number;
  position: number | null;
  userPoints: number;
  isActive: boolean;
  inviteCode: string;
  inviteLink: string | null;
};

export type ListMyLeaguesResponse = {
  items: LeagueSummary[];
};

export type LeagueStandingEntry = {
  position: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  exactHits: number;
  correctSigns: number;
  macroPoints: number;
  isMe: boolean;
  isOwner: boolean;
};

export type LeagueStandingSummary = {
  position: number;
  totalPoints: number;
  exactHits: number;
  correctSigns: number;
  macroPoints: number;
};

export type LeagueStandingsLeague = {
  leagueId: string;
  name: string;
  memberLimit: number;
  membersCount: number;
};

export type LeagueStandingsResponse = {
  league: LeagueStandingsLeague;
  items: LeagueStandingEntry[];
  myStanding: LeagueStandingSummary | null;
};

