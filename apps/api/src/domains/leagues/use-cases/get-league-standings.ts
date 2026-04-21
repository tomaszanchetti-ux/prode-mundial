import type { LeagueStandingsResponse } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";

export async function getLeagueStandings(userId: string, leagueId: string): Promise<LeagueStandingsResponse> {
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

  const [members, standings] = await Promise.all([
    leagueMembersRepository.listMembershipsByLeague(leagueId),
    leagueStandingsRepository.listStandingsByLeague(leagueId)
  ]);

  const items = standings.map((standing) => ({
    ...standing,
    position: standing.position ?? standings.findIndex((item) => item.userId === standing.userId) + 1,
    isMe: standing.userId === userId
  }));
  const myStanding = items.find((item) => item.userId === userId) ?? null;

  return {
    league: {
      leagueId: league.leagueId,
      name: league.name,
      memberLimit: league.memberLimit,
      membersCount: members.length
    },
    items,
    myStanding: myStanding
      ? {
          position: myStanding.position,
          totalPoints: myStanding.totalPoints,
          exactHits: myStanding.exactHits,
          correctSigns: myStanding.correctSigns,
          macroPoints: myStanding.macroPoints
        }
      : null
  };
}

