import {
  resolveR32Bracket,
  resolveTeamIdentity,
  type PredictedGroupStandingRow,
  type R32SlotDefinition,
  type ResolvedGroupStandings,
  type TeamRef,
  type TournamentMode,
  type TournamentProjectionMatch,
  type TournamentProjectionReadiness,
  type TournamentProjectionResponse,
  type TournamentProjectionSide,
  type TuMundialGroupCard,
  type TuMundialResponse
} from "@prode/shared";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import { teamsRepository } from "../../matches/repositories/teams-repository";
import type { StoredMatch, StoredPrediction, StoredTeam } from "../../matches/types";
import { WORLD_CUP_2026_GROUPS } from "../../matches/data/world-cup-2026";
import { preTournamentSummaryService } from "./pre-tournament-summary-service";

type GroupTableAccumulator = {
  teamId: string;
  teamName: string;
  fifaCode: string | null;
  iso2: string | null;
  iso3: string | null;
  flagAsset: string | null;
  flagUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function compareGroupRows(left: GroupTableAccumulator, right: GroupTableAccumulator) {
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

function buildGroupAccumulator(team: StoredTeam | undefined, teamId: string): GroupTableAccumulator {
  const identity = resolveTeamIdentity(team?.fifaCode ?? teamId, team?.flagUrl);

  return {
    teamId,
    teamName: team?.name ?? teamId,
    fifaCode: identity.fifaCode,
    iso2: identity.iso2,
    iso3: identity.iso3,
    flagAsset: identity.flagAsset,
    flagUrl: identity.flagUrl,
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

function applyPredictionToTable(
  tableByTeamId: Map<string, GroupTableAccumulator>,
  match: StoredMatch,
  prediction: StoredPrediction
) {
  if (!match.homeTeamId || !match.awayTeamId) {
    return;
  }

  const homeRow = tableByTeamId.get(match.homeTeamId);
  const awayRow = tableByTeamId.get(match.awayTeamId);

  if (!homeRow || !awayRow) {
    return;
  }

  const homeGoals = prediction.homeScorePred;
  const awayGoals = prediction.awayScorePred;

  homeRow.played += 1;
  awayRow.played += 1;
  homeRow.goalsFor += homeGoals;
  homeRow.goalsAgainst += awayGoals;
  awayRow.goalsFor += awayGoals;
  awayRow.goalsAgainst += homeGoals;
  homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;
  awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;

  if (homeGoals > awayGoals) {
    homeRow.won += 1;
    awayRow.lost += 1;
    homeRow.points += 3;
    return;
  }

  if (homeGoals < awayGoals) {
    awayRow.won += 1;
    homeRow.lost += 1;
    awayRow.points += 3;
    return;
  }

  homeRow.drawn += 1;
  awayRow.drawn += 1;
  homeRow.points += 1;
  awayRow.points += 1;
}

function toProjectedRows(tableByTeamId: Map<string, GroupTableAccumulator>): PredictedGroupStandingRow[] {
  return [...tableByTeamId.values()]
    .sort(compareGroupRows)
    .map((row, index) => ({
      ...row,
      position: index + 1,
      isProjectedQualified: index < 2
    }));
}

function resolveTournamentMode(isPreTournament: boolean): TournamentMode {
  return isPreTournament ? "pre_tournament" : "live_tournament";
}

type ProjectedGroup = {
  groupId: string;
  groupName: string;
  completedMatches: number;
  totalMatches: number;
  rows: PredictedGroupStandingRow[];
};

function buildProjectedGroups(
  groupMatches: StoredMatch[],
  predictionsByMatchId: Map<string, StoredPrediction>,
  teamsById: Map<string, StoredTeam>
): ProjectedGroup[] {
  return WORLD_CUP_2026_GROUPS.map((group) => {
    const matchesForGroup = groupMatches.filter((match) => match.groupId === group.groupId);
    const completedMatches = matchesForGroup.filter((match) => predictionsByMatchId.has(match.matchId)).length;
    const tableByTeamId = new Map(
      group.teamIds.map((teamId) => [teamId, buildGroupAccumulator(teamsById.get(teamId), teamId)])
    );

    for (const match of matchesForGroup) {
      const prediction = predictionsByMatchId.get(match.matchId);

      if (!prediction) {
        continue;
      }

      applyPredictionToTable(tableByTeamId, match, prediction);
    }

    return {
      groupId: group.groupId,
      groupName: `Grupo ${group.name}`,
      completedMatches,
      totalMatches: matchesForGroup.length,
      rows: toProjectedRows(tableByTeamId)
    };
  });
}

function toTuMundialGroupCard(group: ProjectedGroup): TuMundialGroupCard {
  return {
    groupId: group.groupId,
    groupName: group.groupName,
    completedMatches: group.completedMatches,
    totalMatches: group.totalMatches,
    isComplete: group.completedMatches === group.totalMatches,
    items: group.rows
  };
}

function toResolvedGroupStandings(group: ProjectedGroup): ResolvedGroupStandings {
  return {
    groupId: group.groupId,
    positions: group.rows.slice(0, 3).map((row, index) => ({
      position: (index + 1) as 1 | 2 | 3,
      teamId: row.teamId,
      teamName: row.teamName,
      points: row.points,
      goalDifference: row.goalDifference,
      goalsFor: row.goalsFor
    }))
  };
}

function buildTeamRefFromRow(row: PredictedGroupStandingRow): TeamRef {
  return {
    teamId: row.teamId,
    name: row.teamName,
    fifaCode: row.fifaCode,
    iso2: row.iso2,
    iso3: row.iso3,
    flagAsset: row.flagAsset,
    flagUrl: row.flagUrl
  };
}

function buildTeamRefById(teamId: string, teamsById: Map<string, StoredTeam>): TeamRef {
  const team = teamsById.get(teamId);
  const identity = resolveTeamIdentity(team?.fifaCode ?? teamId, team?.flagUrl);

  return {
    teamId,
    name: team?.name ?? teamId,
    fifaCode: identity.fifaCode,
    iso2: identity.iso2,
    iso3: identity.iso3,
    flagAsset: identity.flagAsset,
    flagUrl: identity.flagUrl
  };
}

function buildSlotLabel(slot: string): string {
  const prefix = slot.slice(0, 1);
  const tail = slot.slice(1);

  if (prefix === "1") {
    return `Ganador Grupo ${tail}`;
  }

  if (prefix === "2") {
    return `Segundo Grupo ${tail}`;
  }

  if (prefix === "3") {
    return `Mejor 3ero (${tail.split("").join(", ")})`;
  }

  return slot;
}

function buildProjectionSide(
  slot: string,
  resolvedTeamId: string | null,
  rowsByTeamId: Map<string, PredictedGroupStandingRow>,
  teamsById: Map<string, StoredTeam>
): TournamentProjectionSide {
  if (!resolvedTeamId) {
    return {
      team: null,
      slot,
      slotLabel: buildSlotLabel(slot)
    };
  }

  const row = rowsByTeamId.get(resolvedTeamId);
  const team = row ? buildTeamRefFromRow(row) : buildTeamRefById(resolvedTeamId, teamsById);

  return {
    team,
    slot,
    slotLabel: buildSlotLabel(slot)
  };
}

export class TuMundialService {
  async getTuMundialForUser(userId: string, now = new Date()): Promise<TuMundialResponse> {
    const summary = await preTournamentSummaryService.getSummaryForUser(userId, now);
    const groupMatches = await matchesRepository.listMatches({ stage: "group" });
    const predictionsByMatchId = await predictionsRepository.listPredictionsByUserForMatches(
      userId,
      groupMatches.map((match) => match.matchId)
    );
    const teamsById = await teamsRepository.getTeamsByIds(
      WORLD_CUP_2026_GROUPS.flatMap((group) => group.teamIds)
    );

    const projectedGroups = buildProjectedGroups(groupMatches, predictionsByMatchId, teamsById);

    return {
      mode: resolveTournamentMode(summary.isPreTournament),
      groups: projectedGroups.map(toTuMundialGroupCard),
      updatedAt: now.toISOString()
    };
  }

  async getTournamentProjectionForUser(userId: string, now = new Date()): Promise<TournamentProjectionResponse> {
    const summary = await preTournamentSummaryService.getSummaryForUser(userId, now);
    const groupMatches = await matchesRepository.listMatches({ stage: "group" });
    const r32Matches = await matchesRepository.listMatches({ stage: "R32" });
    const predictionsByMatchId = await predictionsRepository.listPredictionsByUserForMatches(
      userId,
      groupMatches.map((match) => match.matchId)
    );
    const teamsById = await teamsRepository.getTeamsByIds(
      WORLD_CUP_2026_GROUPS.flatMap((group) => group.teamIds)
    );

    const projectedGroups = buildProjectedGroups(groupMatches, predictionsByMatchId, teamsById);
    const standings = projectedGroups.map(toResolvedGroupStandings);

    const rowsByTeamId = new Map<string, PredictedGroupStandingRow>();
    for (const group of projectedGroups) {
      for (const row of group.rows) {
        rowsByTeamId.set(row.teamId, row);
      }
    }

    const slotDefinitions: R32SlotDefinition[] = r32Matches
      .filter((match): match is StoredMatch & { homeSlot: string; awaySlot: string } =>
        Boolean(match.homeSlot && match.awaySlot)
      )
      .map((match) => ({
        matchId: match.matchId,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot
      }));

    const { matches: resolvedR32, unresolvedSlots } = resolveR32Bracket(standings, slotDefinitions);
    const resolvedByMatchId = new Map(resolvedR32.map((match) => [match.matchId, match]));

    const round32: TournamentProjectionMatch[] = r32Matches.map((match) => {
      const resolved = resolvedByMatchId.get(match.matchId);
      const homeSlot = match.homeSlot ?? "?";
      const awaySlot = match.awaySlot ?? "?";

      return {
        matchId: match.matchId,
        stage: match.stage,
        kickoffAt: match.kickoffAt,
        kickoffAtEt: match.kickoffAtEt ?? null,
        venueId: match.venueId ?? null,
        home: buildProjectionSide(homeSlot, resolved?.homeTeamId ?? null, rowsByTeamId, teamsById),
        away: buildProjectionSide(awaySlot, resolved?.awayTeamId ?? null, rowsByTeamId, teamsById)
      };
    });

    const groupMatchesTotal = groupMatches.length;
    const groupMatchesWithPrediction = groupMatches.filter((match) =>
      predictionsByMatchId.has(match.matchId)
    ).length;

    const readiness: TournamentProjectionReadiness = {
      groupMatchesTotal,
      groupMatchesWithPrediction,
      isGroupsComplete: groupMatchesTotal > 0 && groupMatchesWithPrediction === groupMatchesTotal,
      unresolvedSlots
    };

    return {
      mode: resolveTournamentMode(summary.isPreTournament),
      groups: projectedGroups.map(toTuMundialGroupCard),
      bracket: {
        round32
      },
      readiness,
      updatedAt: now.toISOString()
    };
  }
}

export const tuMundialService = new TuMundialService();
