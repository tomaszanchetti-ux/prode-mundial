import type { JoinLeagueInput, LeagueDetail } from "@prode/shared";
import { MAX_LEAGUES_PER_USER } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";
import { rebuildLeagueStandings } from "../services/league-standings-builder";
import { buildMembershipId, normalizeInviteCode, toLeagueDetailView } from "../services/league-domain";
import { syncUserLeaguesCount } from "../services/league-profile-sync";

export async function joinLeague(userId: string, input: JoinLeagueInput): Promise<LeagueDetail> {
  const league = input.inviteToken
    ? await leaguesRepository.findLeagueByInviteToken(input.inviteToken.trim())
    : await leaguesRepository.findLeagueByInviteCode(normalizeInviteCode(input.inviteCode ?? ""));

  if (!league) {
    throw new ApiError(404, "INVITE_INVALID", "Invite code or token is invalid.");
  }

  if (!league.isActive || league.archivedAt) {
    throw new ApiError(409, "LEAGUE_INACTIVE", "League is not active.");
  }

  const [membership, members, userMemberships] = await Promise.all([
    leagueMembersRepository.findMembership(league.leagueId, userId),
    leagueMembersRepository.listMembershipsByLeague(league.leagueId),
    leagueMembersRepository.listMembershipsByUser(userId)
  ]);

  if (membership) {
    throw new ApiError(409, "ALREADY_LEAGUE_MEMBER", "You are already part of this league.");
  }

  if (userMemberships.length >= MAX_LEAGUES_PER_USER) {
    throw new ApiError(409, "USER_LEAGUE_LIMIT_REACHED", "User reached the maximum number of leagues.", {
      maxLeagues: MAX_LEAGUES_PER_USER,
      currentCount: userMemberships.length
    });
  }

  if (members.length >= league.memberLimit) {
    throw new ApiError(409, "LEAGUE_CAPACITY_REACHED", "League reached its member limit.");
  }

  const now = new Date().toISOString();
  const nextMembership = {
    membershipId: buildMembershipId(league.leagueId, userId),
    leagueId: league.leagueId,
    userId,
    role: "member" as const,
    joinedAt: now
  };

  await leagueMembersRepository.upsertMembership(nextMembership);
  await rebuildLeagueStandings(league.leagueId, now);
  await syncUserLeaguesCount(userId);

  const [nextMembers, myStanding] = await Promise.all([
    leagueMembersRepository.listMembershipsByLeague(league.leagueId),
    leagueStandingsRepository.getStanding(league.leagueId, userId)
  ]);

  return toLeagueDetailView({
    league,
    membership: nextMembership,
    members: nextMembers,
    myStanding
  });
}
