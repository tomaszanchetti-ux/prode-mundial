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

export type LeagueMembershipRole = "owner" | "member";

export type ListMyLeaguesResponse = {
  items: LeagueSummary[];
};

export type CreateLeagueInput = {
  name: string;
};

export type JoinLeagueInput = {
  inviteCode?: string;
  inviteToken?: string;
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

export type LeagueStandingMini = LeagueStandingSummary;

export type LeagueStandingsLeague = {
  leagueId: string;
  name: string;
  memberLimit: number;
  membersCount: number;
};

export type LeagueDetail = {
  leagueId: string;
  name: string;
  memberLimit: number;
  membersCount: number;
  isActive: boolean;
  inviteCode: string;
  inviteLink: string | null;
  membershipRole: LeagueMembershipRole;
  myStanding: LeagueStandingMini | null;
};

export type LeagueInvitePreview = {
  leagueId: string;
  name: string;
  memberLimit: number;
  membersCount: number;
  isActive: boolean;
};

export type LeagueStandingsResponse = {
  league: LeagueStandingsLeague;
  items: LeagueStandingEntry[];
  myStanding: LeagueStandingSummary | null;
};
