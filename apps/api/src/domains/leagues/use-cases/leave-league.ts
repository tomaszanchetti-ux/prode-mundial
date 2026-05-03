import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { rebuildLeagueStandings } from "../services/league-standings-builder";
import { syncUserLeaguesCount } from "../services/league-profile-sync";

export async function leaveLeague(userId: string, leagueId: string): Promise<void> {
  const league = await leaguesRepository.getLeagueById(leagueId);

  if (!league) {
    throw new ApiError(404, "LEAGUE_NOT_FOUND", "League not found.");
  }

  const membership = await leagueMembersRepository.findMembership(leagueId, userId);

  if (!membership) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "You are not a member of this league.");
  }

  if (membership.role === "owner") {
    throw new ApiError(409, "LEAGUE_OWNER_CANNOT_LEAVE", "Owners cannot leave their own league. Delete it instead.");
  }

  await leagueMembersRepository.deleteMembership(membership.membershipId);
  await rebuildLeagueStandings(leagueId, new Date().toISOString());
  await syncUserLeaguesCount(userId);
}
