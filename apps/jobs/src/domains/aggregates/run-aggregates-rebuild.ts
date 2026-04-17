import { aggregatesLeagueMembersRepository } from "./repositories/league-members-repository";
import { aggregatesUsersRepository } from "./repositories/users-repository";
import { rebuildLeagueStandings } from "./services/rebuild-league-standings";
import { rebuildUserAggregates } from "./services/rebuild-user-aggregates";
import type { AggregatesRebuildSummary } from "./types";

export async function rebuildAggregatesForUsers(
  userIds: string[],
  nowIso = new Date().toISOString()
): Promise<AggregatesRebuildSummary> {
  const summary: AggregatesRebuildSummary = {
    usersRebuilt: 0,
    leaguesRebuilt: 0,
    errors: []
  };

  const uniqueUserIds = [...new Set(userIds)];
  const affectedLeagueIds = new Set<string>();

  for (const userId of uniqueUserIds) {
    try {
      const memberships = await aggregatesLeagueMembersRepository.listMembershipsByUser(userId);
      const profile = await rebuildUserAggregates(userId);

      if (profile) {
        await aggregatesUsersRepository.upsertProfile({
          ...profile,
          leaguesCount: memberships.length
        });
        summary.usersRebuilt++;
      }

      for (const membership of memberships) {
        affectedLeagueIds.add(membership.leagueId);
      }
    } catch (err) {
      summary.errors.push({
        scope: `user:${userId}`,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  for (const leagueId of affectedLeagueIds) {
    try {
      await rebuildLeagueStandings(leagueId, nowIso);
      summary.leaguesRebuilt++;
    } catch (err) {
      summary.errors.push({
        scope: `league:${leagueId}`,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return summary;
}
