import type { LeagueDetail } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";
import { toLeagueDetailView } from "../services/league-domain";

export async function getLeagueDetail(userId: string, leagueId: string): Promise<LeagueDetail> {
  const [league, membership] = await Promise.all([
    leaguesRepository.getLeagueById(leagueId),
    leagueMembersRepository.findMembership(leagueId, userId)
  ]);

  if (!league) {
    throw new ApiError(404, "LEAGUE_NOT_FOUND", "League was not found.");
  }

  if (!membership) {
    throw new ApiError(403, "FORBIDDEN", "You are not a member of this league.");
  }

  const [members, myStanding] = await Promise.all([
    leagueMembersRepository.listMembershipsByLeague(leagueId),
    leagueStandingsRepository.getStanding(leagueId, userId)
  ]);

  return toLeagueDetailView({
    league,
    membership,
    members,
    myStanding
  });
}
