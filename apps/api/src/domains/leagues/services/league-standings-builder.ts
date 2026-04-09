import type { UserPointsSummary } from "@prode/shared";
import { usersRepository } from "../../users/repositories/users-repository";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leagueStandingsRepository } from "../repositories/league-standings-repository";
import type { StoredLeagueMember, StoredLeagueStanding } from "../types";

function compareStandings(left: StoredLeagueStanding, right: StoredLeagueStanding) {
  if (left.totalPoints !== right.totalPoints) {
    return right.totalPoints - left.totalPoints;
  }

  if (left.exactHits !== right.exactHits) {
    return right.exactHits - left.exactHits;
  }

  if (left.correctSigns !== right.correctSigns) {
    return right.correctSigns - left.correctSigns;
  }

  if (left.macroPoints !== right.macroPoints) {
    return right.macroPoints - left.macroPoints;
  }

  return left.displayName.localeCompare(right.displayName);
}

function buildPointsSummary(input?: Partial<UserPointsSummary>): UserPointsSummary {
  return {
    totalPoints: input?.totalPoints ?? 0,
    macroPoints: input?.macroPoints ?? 0,
    exactHits: input?.exactHits ?? 0,
    correctSigns: input?.correctSigns ?? 0
  };
}

export function buildLeagueStandingRows(
  leagueId: string,
  memberships: StoredLeagueMember[],
  profiles: Array<{ userId: string; displayName: string } & Partial<UserPointsSummary>>,
  nowIso: string
): StoredLeagueStanding[] {
  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));

  return memberships
    .map((membership) => {
      const profile = profileMap.get(membership.userId);
      const summary = buildPointsSummary(profile);

      return {
        leagueId,
        userId: membership.userId,
        displayName: profile?.displayName ?? membership.userId,
        totalPoints: summary.totalPoints,
        macroPoints: summary.macroPoints,
        exactHits: summary.exactHits,
        correctSigns: summary.correctSigns,
        position: null,
        isOwner: membership.role === "owner",
        lastUpdatedAt: nowIso,
        lastPointArrivalAt: null
      } satisfies StoredLeagueStanding;
    })
    .sort(compareStandings)
    .map((standing, index) => ({
      ...standing,
      position: index + 1
    }));
}

export async function rebuildLeagueStandings(leagueId: string, nowIso = new Date().toISOString()) {
  const memberships = await leagueMembersRepository.listMembershipsByLeague(leagueId);
  const profiles = await usersRepository.listByUserIds(memberships.map((membership) => membership.userId));
  const standings = buildLeagueStandingRows(leagueId, memberships, profiles, nowIso);

  await leagueStandingsRepository.replaceStandings(leagueId, standings);

  return standings;
}

