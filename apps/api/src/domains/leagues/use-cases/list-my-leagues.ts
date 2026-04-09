import type { ListMyLeaguesResponse } from "@prode/shared";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";

export async function listMyLeagues(userId: string): Promise<ListMyLeaguesResponse> {
  const memberships = await leagueMembersRepository.listMembershipsByUser(userId);
  const leagues = await leaguesRepository.listLeaguesByIds(memberships.map((membership) => membership.leagueId));
  const leagueMap = new Map(leagues.map((league) => [league.leagueId, league]));

  const items = await Promise.all(
    memberships.map(async (membership) => {
      const league = leagueMap.get(membership.leagueId);

      if (!league) {
        return null;
      }

      const [members, myStanding] = await Promise.all([
        leagueMembersRepository.listMembershipsByLeague(league.leagueId),
        leagueStandingsRepository.getStanding(league.leagueId, userId)
      ]);

      return {
        leagueId: league.leagueId,
        name: league.name,
        memberLimit: league.memberLimit,
        membersCount: members.length,
        position: myStanding?.position ?? null,
        userPoints: myStanding?.totalPoints ?? 0,
        isActive: league.isActive,
        inviteCode: league.inviteCode,
        inviteLink: league.inviteLink
      };
    })
  );

  return {
    items: items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => left.name.localeCompare(right.name))
  };
}

