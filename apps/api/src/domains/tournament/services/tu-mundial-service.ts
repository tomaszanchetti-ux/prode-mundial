import {
  buildSlotLabel,
  planFullHydration,
  resolveR32Bracket,
  resolveTeamIdentity,
  simulateKnockoutBracket,
  type BracketSimulatorMatch,
  type BracketSimulatorPrediction,
  type GroupDefinition,
  type HydrationMatch,
  type KnockoutStage,
  type PredictedGroupStandingRow,
  type R32SlotDefinition,
  type ResolvedGroupStandings,
  type SimulatedKnockoutMatch,
  type TeamRef,
  type TournamentMode,
  type TournamentPhaseUnlocks,
  type TournamentProjectionBracket,
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
import { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_TEAMS } from "../../matches/data/world-cup-2026";
import { preTournamentSummaryService } from "./pre-tournament-summary-service";

const TEAM_NAMES_BY_ID = new Map<string, string>(
  WORLD_CUP_2026_TEAMS.map((team) => [team.teamId, team.name])
);

const HYDRATION_GROUP_DEFINITIONS: GroupDefinition[] = WORLD_CUP_2026_GROUPS.map((group) => ({
  groupId: group.groupId,
  teams: group.teamIds.map((teamId) => ({
    teamId,
    teamName: TEAM_NAMES_BY_ID.get(teamId) ?? teamId
  }))
}));

function toHydrationMatch(match: StoredMatch): HydrationMatch {
  return {
    matchId: match.matchId,
    stage: match.stage,
    officialMatchNumber: match.officialMatchNumber,
    groupId: match.groupId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeSlot: match.homeSlot ?? null,
    awaySlot: match.awaySlot ?? null,
    homeScore90: match.homeScore90,
    awayScore90: match.awayScore90,
    winnerTeamId: match.winnerTeamId,
    status: match.status
  };
}

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
    const allMatches = await matchesRepository.listMatches();
    const groupMatches = allMatches.filter((match) => match.stage === "group");
    const knockoutMatches = allMatches.filter((match) => match.stage !== "group");

    const predictionsByMatchId = await predictionsRepository.listPredictionsByUserForMatches(
      userId,
      allMatches.map((match) => match.matchId)
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

    const r32Matches = knockoutMatches.filter((match) => match.stage === "R32");
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
    const resolvedR32ByMatchId = new Map(resolvedR32.map((match) => [match.matchId, match]));

    const simulatorInputMatches: BracketSimulatorMatch[] = knockoutMatches.map((match) => {
      const stage = match.stage as KnockoutStage;
      const officialMatchNumber = match.officialMatchNumber ?? 0;

      if (stage === "R32") {
        const resolved = resolvedR32ByMatchId.get(match.matchId);

        return {
          matchId: match.matchId,
          stage,
          officialMatchNumber,
          homeSlot: match.homeSlot ?? null,
          awaySlot: match.awaySlot ?? null,
          homeTeamId: resolved?.homeTeamId ?? null,
          awayTeamId: resolved?.awayTeamId ?? null
        };
      }

      return {
        matchId: match.matchId,
        stage,
        officialMatchNumber,
        homeSlot: match.homeSlot ?? null,
        awaySlot: match.awaySlot ?? null,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId
      };
    });

    const simulatorPredictions: BracketSimulatorPrediction[] = [];

    for (const knockoutMatch of knockoutMatches) {
      const prediction = predictionsByMatchId.get(knockoutMatch.matchId);

      if (!prediction) {
        continue;
      }

      simulatorPredictions.push({
        matchId: knockoutMatch.matchId,
        homeScorePred: prediction.homeScorePred,
        awayScorePred: prediction.awayScorePred,
        predictedQualifierTeamId: prediction.predictedQualifierTeamId ?? null
      });
    }

    const { matches: simulated } = simulateKnockoutBracket({
      matches: simulatorInputMatches,
      predictions: simulatorPredictions
    });

    const simulatedByMatchId = new Map(simulated.map((match) => [match.matchId, match]));

    const buildProjectionMatch = (match: StoredMatch): TournamentProjectionMatch => {
      const simulation: SimulatedKnockoutMatch | undefined = simulatedByMatchId.get(match.matchId);
      const homeSlot = match.homeSlot ?? "?";
      const awaySlot = match.awaySlot ?? "?";

      return {
        matchId: match.matchId,
        officialMatchNumber: match.officialMatchNumber ?? 0,
        stage: match.stage,
        kickoffAt: match.kickoffAt,
        kickoffAtEt: match.kickoffAtEt ?? null,
        venueId: match.venueId ?? null,
        home: buildProjectionSide(homeSlot, simulation?.homeTeamId ?? null, rowsByTeamId, teamsById),
        away: buildProjectionSide(awaySlot, simulation?.awayTeamId ?? null, rowsByTeamId, teamsById),
        winnerTeamId: simulation?.winnerTeamId ?? null,
        source: simulation?.source ?? "unresolved"
      };
    };

    const bracket: TournamentProjectionBracket = {
      round32: knockoutMatches.filter((match) => match.stage === "R32").map(buildProjectionMatch),
      round16: knockoutMatches.filter((match) => match.stage === "R16").map(buildProjectionMatch),
      quarterfinals: knockoutMatches.filter((match) => match.stage === "QF").map(buildProjectionMatch),
      semifinals: knockoutMatches.filter((match) => match.stage === "SF").map(buildProjectionMatch),
      bronze: knockoutMatches.filter((match) => match.stage === "BRONZE").map(buildProjectionMatch),
      final: knockoutMatches.filter((match) => match.stage === "FINAL").map(buildProjectionMatch)
    };

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

    const hydrationPlan = planFullHydration(allMatches.map(toHydrationMatch), HYDRATION_GROUP_DEFINITIONS);
    const phaseUnlocks: TournamentPhaseUnlocks = hydrationPlan.phaseUnlocks;

    return {
      mode: resolveTournamentMode(summary.isPreTournament),
      groups: projectedGroups.map(toTuMundialGroupCard),
      bracket,
      readiness,
      phaseUnlocks,
      updatedAt: now.toISOString()
    };
  }
}

export const tuMundialService = new TuMundialService();
