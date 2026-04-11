import { resolveTeamIdentity, type PredictedGroupStandingRow, type TournamentMode, type TuMundialGroupCard, type TuMundialResponse } from "@prode/shared";
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

    const groups = WORLD_CUP_2026_GROUPS.map<TuMundialGroupCard>((group) => {
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
        isComplete: completedMatches === matchesForGroup.length,
        items: toProjectedRows(tableByTeamId)
      };
    });

    return {
      mode: resolveTournamentMode(summary.isPreTournament),
      groups,
      updatedAt: now.toISOString()
    };
  }
}

export const tuMundialService = new TuMundialService();
