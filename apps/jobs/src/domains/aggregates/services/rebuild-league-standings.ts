import { aggregatesLeagueMembersRepository } from "../repositories/league-members-repository";
import { aggregatesLeagueStandingsRepository } from "../repositories/league-standings-repository";
import { aggregatesUsersRepository } from "../repositories/users-repository";
import type { AggregatesLeagueStanding } from "../types";
import { buildLeagueStandingRows } from "./league-standings-builder";

export async function rebuildLeagueStandings(
  leagueId: string,
  nowIso = new Date().toISOString()
): Promise<AggregatesLeagueStanding[]> {
  const memberships = await aggregatesLeagueMembersRepository.listMembershipsByLeague(leagueId);
  const profiles = await aggregatesUsersRepository.listByUserIds(
    memberships.map((membership) => membership.userId)
  );
  const standings = buildLeagueStandingRows(leagueId, memberships, profiles, nowIso);

  await aggregatesLeagueStandingsRepository.replaceStandings(leagueId, standings);

  return standings;
}
