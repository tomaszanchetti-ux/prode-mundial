import type { LeagueInvitePreview } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";

export async function getLeagueInvitePreview(inviteToken: string): Promise<LeagueInvitePreview> {
  const league = await leaguesRepository.findLeagueByInviteToken(inviteToken);

  if (!league) {
    throw new ApiError(404, "INVITE_INVALID", "Invite token is invalid.");
  }

  if (!league.isActive || league.archivedAt) {
    throw new ApiError(409, "LEAGUE_INACTIVE", "League is not active.");
  }

  const members = await leagueMembersRepository.listMembershipsByLeague(league.leagueId);

  return {
    leagueId: league.leagueId,
    name: league.name,
    memberLimit: league.memberLimit,
    membersCount: members.length,
    isActive: league.isActive
  };
}
