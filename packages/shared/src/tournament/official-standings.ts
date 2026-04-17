/**
 * Computes official group standings from finalized group matches.
 *
 * "Official" here means: the match has a 90-minute score recorded on both
 * sides. A match missing a score does not contribute to any team's row.
 *
 * The tie-break order is a simplified subset of FIFA 2026:
 *   1. points (desc)
 *   2. goal difference (desc)
 *   3. goals scored (desc)
 *   4. teamName lexicographic (asc)
 *
 * Head-to-head tie-breakers are intentionally not implemented — the app does
 * not model it yet and the simpler rules keep the output deterministic.
 *
 * This is a pure function, reused by the official hydration pipeline and by
 * the `tu-mundial` projection (which substitutes user predictions for
 * official scores).
 */

import type { GroupStandingPosition, ResolvedGroupStandings } from "./r32-bracket-resolver";

export type GroupMatchResult = {
  matchId: string;
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export type TeamDescriptor = {
  teamId: string;
  teamName: string;
};

export type GroupDefinition = {
  groupId: string;
  teams: TeamDescriptor[];
};

type StandingAccumulator = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function createAccumulator(team: TeamDescriptor): StandingAccumulator {
  return {
    teamId: team.teamId,
    teamName: team.teamName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };
}

function applyMatch(accumulators: Map<string, StandingAccumulator>, match: GroupMatchResult) {
  const home = accumulators.get(match.homeTeamId);
  const away = accumulators.get(match.awayTeamId);

  if (!home || !away) {
    return;
  }

  home.played += 1;
  away.played += 1;
  home.goalsFor += match.homeScore;
  home.goalsAgainst += match.awayScore;
  away.goalsFor += match.awayScore;
  away.goalsAgainst += match.homeScore;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (match.homeScore > match.awayScore) {
    home.won += 1;
    away.lost += 1;
    home.points += 3;
    return;
  }

  if (match.homeScore < match.awayScore) {
    away.won += 1;
    home.lost += 1;
    away.points += 3;
    return;
  }

  home.drawn += 1;
  away.drawn += 1;
  home.points += 1;
  away.points += 1;
}

function compareStandings(left: StandingAccumulator, right: StandingAccumulator): number {
  if (left.points !== right.points) {
    return right.points - left.points;
  }

  if (left.goalDifference !== right.goalDifference) {
    return right.goalDifference - left.goalDifference;
  }

  if (left.goalsFor !== right.goalsFor) {
    return right.goalsFor - left.goalsFor;
  }

  return left.teamName.localeCompare(right.teamName);
}

export function computeGroupStandings(
  groups: GroupDefinition[],
  results: GroupMatchResult[]
): ResolvedGroupStandings[] {
  const resultsByGroupId = new Map<string, GroupMatchResult[]>();

  for (const result of results) {
    const existing = resultsByGroupId.get(result.groupId);
    if (existing) {
      existing.push(result);
    } else {
      resultsByGroupId.set(result.groupId, [result]);
    }
  }

  return groups.map((group) => {
    const accumulators = new Map<string, StandingAccumulator>(
      group.teams.map((team) => [team.teamId, createAccumulator(team)])
    );

    for (const match of resultsByGroupId.get(group.groupId) ?? []) {
      applyMatch(accumulators, match);
    }

    const positions: GroupStandingPosition[] = [...accumulators.values()]
      .sort(compareStandings)
      .slice(0, 3)
      .map((row, index) => ({
        position: (index + 1) as 1 | 2 | 3,
        teamId: row.teamId,
        teamName: row.teamName,
        points: row.points,
        goalDifference: row.goalDifference,
        goalsFor: row.goalsFor
      }));

    return {
      groupId: group.groupId,
      positions
    };
  });
}
