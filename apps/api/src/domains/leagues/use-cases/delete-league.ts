import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { syncUserLeaguesCount } from "../services/league-profile-sync";

export async function deleteLeague(userId: string, leagueId: string): Promise<void> {
  const league = await leaguesRepository.getLeagueById(leagueId);

  if (!league) {
    throw new ApiError(404, "LEAGUE_NOT_FOUND", "League not found.");
  }

  if (league.ownerUserId !== userId) {
    throw new ApiError(403, "LEAGUE_NOT_OWNER", "Only the league owner can delete it.");
  }

  const members = await leagueMembersRepository.listMembershipsByLeague(leagueId);
  const affectedUserIds = members.map((m) => m.userId);

  await leagueMembersRepository.deleteMembershipsByLeague(leagueId);
  await leagueStandingsRepository.deleteStandings(leagueId);
  await leaguesRepository.deleteLeague(leagueId);

  await Promise.all(affectedUserIds.map((uid) => syncUserLeaguesCount(uid)));
}
