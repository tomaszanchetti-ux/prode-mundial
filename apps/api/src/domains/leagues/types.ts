import type {
  LeagueDetail,
  LeagueInvitePreview,
  LeagueMembershipRole,
  LeagueStandingSummary,
  LeagueStandingsLeague,
  LeagueSummary,
  UserPointsSummary
} from "@prode/shared";

export type StoredLeague = {
  leagueId: string;
  name: string;
  ownerUserId: string;
  memberLimit: number;
  inviteCode: string;
  inviteToken: string;
  inviteLink: string | null;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredLeagueMemberRole = "owner" | "member";

export type StoredLeagueMember = {
  membershipId: string;
  leagueId: string;
  userId: string;
  role: StoredLeagueMemberRole;
  joinedAt: string;
};

export type StoredLeagueStanding = UserPointsSummary & {
  leagueId: string;
  userId: string;
  displayName: string;
  position: number | null;
  isOwner: boolean;
  lastUpdatedAt: string;
  lastPointArrivalAt: string | null;
};

export type LeagueSummaryView = LeagueSummary;

export type LeagueDetailView = LeagueDetail;

export type LeagueInvitePreviewView = LeagueInvitePreview;

export type LeagueMembershipRoleView = LeagueMembershipRole;

export type LeagueStandingsView = {
  league: LeagueStandingsLeague;
  items: Array<
    StoredLeagueStanding & {
      position: number;
      isMe: boolean;
    }
  >;
  myStanding: LeagueStandingSummary | null;
};
