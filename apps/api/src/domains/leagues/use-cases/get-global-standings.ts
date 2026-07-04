import type { GlobalStandingsResponse } from "@prode/shared";
import { usersRepository } from "../../users/repositories/users-repository";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import { buildGlobalStandingRows, collectUserLeagueNames } from "../services/global-standings-builder";

export async function getGlobalStandings(userId: string): Promise<GlobalStandingsResponse> {
  const activeLeagues = await leaguesRepository.listActiveLeagues();
  const membershipLists = await Promise.all(
    activeLeagues.map((league) => leagueMembersRepository.listMembershipsByLeague(league.leagueId))
  );
  const userLeagueNames = collectUserLeagueNames(activeLeagues, membershipLists);
  const uniqueUserIds = [...userLeagueNames.keys()];

  if (uniqueUserIds.length === 0) {
    return {
      participantsCount: 0,
      items: [],
      myStanding: null
    };
  }

  const profiles = await usersRepository.listByUserIds(uniqueUserIds);
  const items = buildGlobalStandingRows(
    profiles.map((profile) => ({
      userId: profile.userId,
      displayName: profile.displayName,
      leagueNames: userLeagueNames.get(profile.userId) ?? [],
      totalPoints: profile.totalPoints,
      macroPoints: profile.macroPoints,
      exactHits: profile.exactHits,
      correctSigns: profile.correctSigns
    })),
    userId
  );
  const myStanding = items.find((item) => item.userId === userId) ?? null;

  return {
    participantsCount: uniqueUserIds.length,
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
