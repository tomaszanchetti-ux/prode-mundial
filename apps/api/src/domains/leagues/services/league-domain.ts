import { randomBytes, randomUUID } from "node:crypto";
import type { LeagueDetailView, StoredLeague, StoredLeagueMember, StoredLeagueMemberRole, StoredLeagueStanding } from "../types";

export function buildMembershipId(leagueId: string, userId: string) {
  return `${leagueId}__${userId}`;
}

export function buildInviteLink(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  return `${baseUrl}/leagues/join?token=${token}`;
}

export function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().replace(/\s+/g, "").toUpperCase();
}

export function createLeagueId() {
  return `lg_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function createInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function createInviteToken() {
  return randomBytes(12).toString("hex");
}

export function toLeagueDetailView(input: {
  league: StoredLeague;
  membership: StoredLeagueMember;
  members: StoredLeagueMember[];
  myStanding: StoredLeagueStanding | null;
}): LeagueDetailView {
  const { league, membership, members, myStanding } = input;

  return {
    leagueId: league.leagueId,
    name: league.name,
    memberLimit: league.memberLimit,
    membersCount: members.length,
    isActive: league.isActive,
    inviteCode: league.inviteCode,
    inviteLink: buildInviteLink(league.inviteToken),
    membershipRole: membership.role as StoredLeagueMemberRole,
    myStanding: myStanding
      ? {
          position: myStanding.position ?? 1,
          totalPoints: myStanding.totalPoints,
          exactHits: myStanding.exactHits,
          correctSigns: myStanding.correctSigns,
          macroPoints: myStanding.macroPoints
        }
      : null
  };
}
