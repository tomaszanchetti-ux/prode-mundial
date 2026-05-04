import type { CreateLeagueInput, LeagueDetail } from "@prode/shared";
import { LEAGUE_MEMBER_LIMIT, MAX_LEAGUES_PER_USER } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { leaguesRepository } from "../repositories/leagues-repository";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { rebuildLeagueStandings } from "../services/league-standings-builder";
import {
  buildInviteLink,
  buildMembershipId,
  createInviteCode,
  createInviteToken,
  createLeagueId,
  toLeagueDetailView
} from "../services/league-domain";
import { syncUserLeaguesCount } from "../services/league-profile-sync";
import type { StoredLeague } from "../types";

async function generateUniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = createInviteCode();
    const existing = await leaguesRepository.findLeagueByInviteCode(inviteCode);

    if (!existing) {
      return inviteCode;
    }
  }

  throw new Error("Could not generate a unique invite code.");
}

async function generateUniqueInviteToken() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteToken = createInviteToken();
    const existing = await leaguesRepository.findLeagueByInviteToken(inviteToken);

    if (!existing) {
      return inviteToken;
    }
  }

  throw new Error("Could not generate a unique invite token.");
}

export async function createLeague(
  userId: string,
  input: CreateLeagueInput,
  options: { bypassUserLimit?: boolean } = {}
): Promise<LeagueDetail> {
  const existingMemberships = await leagueMembersRepository.listMembershipsByUser(userId);
  if (!options.bypassUserLimit && existingMemberships.length >= MAX_LEAGUES_PER_USER) {
    throw new ApiError(409, "USER_LEAGUE_LIMIT_REACHED", "User reached the maximum number of leagues.", {
      maxLeagues: MAX_LEAGUES_PER_USER,
      currentCount: existingMemberships.length
    });
  }

  const now = new Date().toISOString();
  const [inviteCode, inviteToken] = await Promise.all([generateUniqueInviteCode(), generateUniqueInviteToken()]);
  const leagueId = createLeagueId();

  const league: StoredLeague = {
    leagueId,
    name: input.name,
    ownerUserId: userId,
    memberLimit: LEAGUE_MEMBER_LIMIT,
    inviteCode,
    inviteToken,
    inviteLink: buildInviteLink(inviteToken),
    isActive: true,
    archivedAt: null,
    createdAt: now,
    updatedAt: now
  };

  const membership = {
    membershipId: buildMembershipId(leagueId, userId),
    leagueId,
    userId,
    role: "owner" as const,
    joinedAt: now
  };

  await leaguesRepository.upsertLeague(league);
  await leagueMembersRepository.upsertMembership(membership);
  await rebuildLeagueStandings(leagueId, now);
  await syncUserLeaguesCount(userId);

  return toLeagueDetailView({
    league,
    membership,
    members: [membership],
    myStanding: {
      leagueId,
      userId,
      displayName: userId,
      totalPoints: 0,
      macroPoints: 0,
      exactHits: 0,
      correctSigns: 0,
      position: 1,
      isOwner: true,
      lastUpdatedAt: now,
      lastPointArrivalAt: null
    }
  });
}
