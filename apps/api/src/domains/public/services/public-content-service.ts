import {
  computeFullGroupStandings,
  type FullGroupStandings,
  type GroupDefinition,
  type GroupMatchResult,
  type MatchStage,
  type MatchSummary,
  type PublicMatch,
  type PublicMatchListFilter,
  type PublicTeam
} from "@prode/shared";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { teamsRepository } from "../../matches/repositories/teams-repository";
import type { StoredMatch } from "../../matches/types";
import { buildTournamentContext, toMatchSummary } from "../../matches/services/match-payloads";

type PublicMatchesQuery = {
  stage?: MatchStage;
  filter?: PublicMatchListFilter;
};

function collectTeamIds(matches: StoredMatch[]): string[] {
  return matches.flatMap((match) =>
    [match.homeTeamId, match.awayTeamId].filter((teamId): teamId is string => Boolean(teamId))
  );
}

/**
 * Projects a (prediction-free) MatchSummary down to the public payload,
 * dropping every user/CTA-scoped field. We build the summary with a `null`
 * prediction so all the tournament-phase derivations (status, slot labels,
 * live/finished gating) are reused verbatim from the authenticated path.
 */
function toPublicMatch(summary: MatchSummary): PublicMatch {
  return {
    matchId: summary.matchId,
    officialMatchNumber: summary.officialMatchNumber,
    stage: summary.stage,
    groupId: summary.groupId,
    homeTeam: summary.homeTeam,
    awayTeam: summary.awayTeam,
    homeSlot: summary.homeSlot,
    awaySlot: summary.awaySlot,
    kickoffAt: summary.kickoffAt,
    status: summary.status,
    homeScore90: summary.homeScore90,
    awayScore90: summary.awayScore90,
    winnerTeamId: summary.winnerTeamId
  };
}

function filterPublicSummaries(
  items: MatchSummary[],
  filter: PublicMatchListFilter | undefined,
  now: Date
): MatchSummary[] {
  if (!filter || filter === "all") {
    return items;
  }

  if (filter === "today") {
    const todayIso = now.toISOString().slice(0, 10);
    return items.filter((item) => item.kickoffAt.slice(0, 10) === todayIso);
  }

  if (filter === "upcoming") {
    return items.filter((item) => item.kickoffAt >= now.toISOString() && item.status === "scheduled");
  }

  if (filter === "finished") {
    return items.filter((item) => item.status === "finished");
  }

  return items;
}

export class PublicContentService {
  async listMatches(query: PublicMatchesQuery = {}, now = new Date()): Promise<PublicMatch[]> {
    const matches = await matchesRepository.listMatches({ stage: query.stage });
    const teamsById = await teamsRepository.getTeamsByIds(collectTeamIds(matches));
    // Phase context (CLOSE/OPEN gates) needs the full fixture list; only reload
    // when a stage filter narrowed the primary query.
    const contextSource = query.stage ? await matchesRepository.listMatches({}) : matches;
    const context = buildTournamentContext(contextSource);

    const summaries = matches.map((match) => toMatchSummary(match, null, teamsById, now, context));
    return filterPublicSummaries(summaries, query.filter, now).map(toPublicMatch);
  }

  async getMatch(matchId: string, now = new Date()): Promise<PublicMatch | null> {
    const match = await matchesRepository.getMatchById(matchId);

    if (!match) {
      return null;
    }

    const teamsById = await teamsRepository.getTeamsByIds(collectTeamIds([match]));
    const context = buildTournamentContext(await matchesRepository.listMatches({}));

    return toPublicMatch(toMatchSummary(match, null, teamsById, now, context));
  }

  async getStandings(): Promise<FullGroupStandings[]> {
    const groupMatches = await matchesRepository.listMatches({ stage: "group" });
    const teamsById = await teamsRepository.getTeamsByIds(collectTeamIds(groupMatches));

    const teamsByGroup = new Map<string, Map<string, string>>();
    for (const match of groupMatches) {
      if (!match.groupId) {
        continue;
      }

      const groupTeams = teamsByGroup.get(match.groupId) ?? new Map<string, string>();
      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        if (teamId) {
          groupTeams.set(teamId, teamsById.get(teamId)?.name ?? teamId);
        }
      }
      teamsByGroup.set(match.groupId, groupTeams);
    }

    const groups: GroupDefinition[] = [...teamsByGroup.entries()]
      .sort(([leftGroupId], [rightGroupId]) => leftGroupId.localeCompare(rightGroupId))
      .map(([groupId, teams]) => ({
        groupId,
        teams: [...teams.entries()].map(([teamId, teamName]) => ({ teamId, teamName }))
      }));

    const results: GroupMatchResult[] = groupMatches
      .filter(
        (match) =>
          match.groupId !== null &&
          match.homeTeamId !== null &&
          match.awayTeamId !== null &&
          match.homeScore90 !== null &&
          match.awayScore90 !== null
      )
      .map((match) => ({
        matchId: match.matchId,
        groupId: match.groupId as string,
        homeTeamId: match.homeTeamId as string,
        awayTeamId: match.awayTeamId as string,
        homeScore: match.homeScore90 as number,
        awayScore: match.awayScore90 as number
      }));

    return computeFullGroupStandings(groups, results);
  }

  async listTeams(): Promise<PublicTeam[]> {
    const teams = await teamsRepository.listTeams();

    return teams
      .filter((team) => team.isActive !== false)
      .map((team) => ({
        teamId: team.teamId,
        fifaCode: team.fifaCode,
        iso2: team.iso2,
        name: team.name,
        shortName: team.shortName,
        flagUrl: team.flagUrl,
        groupId: team.groupId
      }))
      .sort(
        (left, right) =>
          (left.groupId ?? "").localeCompare(right.groupId ?? "") || left.name.localeCompare(right.name)
      );
  }
}

export const publicContentService = new PublicContentService();
