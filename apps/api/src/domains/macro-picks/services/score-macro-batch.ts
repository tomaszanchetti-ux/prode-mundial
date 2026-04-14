import { ApiError } from "../../../server/errors/api-error";
import type { MacroTournamentResults } from "@prode/shared";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import { macroPicksRepository } from "../repositories/macro-picks-repository";
import { macroResultsRepository } from "../repositories/macro-results-repository";
import { macroScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { persistMacroScoreForPrediction } from "./score-macro-prediction";

async function rebuildAffectedUsersAndLeagues(userIds: string[], nowIso: string) {
  const affectedLeagueIds = new Set<string>();

  for (const userId of userIds) {
    await rebuildUserAggregates(userId);
    const memberships = await leagueMembersRepository.listMembershipsByUser(userId);

    for (const membership of memberships) {
      affectedLeagueIds.add(membership.leagueId);
    }
  }

  await Promise.all([...affectedLeagueIds].map((leagueId) => rebuildLeagueStandings(leagueId, nowIso)));

  return affectedLeagueIds.size;
}

async function resolveResults(tournamentId: string, inputResults?: MacroTournamentResults): Promise<MacroTournamentResults> {
  const storedResults = inputResults ?? (await macroResultsRepository.getByTournamentId(tournamentId));

  if (!storedResults) {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Official macro results were not found for this tournament.");
  }

  return {
    groups: storedResults.groups,
    finalists: storedResults.finalists,
    champion: storedResults.champion
  };
}

async function scorePredictionsWithResults(tournamentId: string, results: MacroTournamentResults, nowIso: string) {
  const predictions = await macroPicksRepository.listSubmitted();

  for (const prediction of predictions) {
    await persistMacroScoreForPrediction(prediction, tournamentId, results, nowIso);
  }

  return predictions;
}

export async function scoreMacroBatch(
  tournamentId: string,
  inputResults?: MacroTournamentResults,
  nowIso = new Date().toISOString()
) {
  const results = await resolveResults(tournamentId, inputResults);
  const predictions = await scorePredictionsWithResults(tournamentId, results, nowIso);

  const affectedLeagues = await rebuildAffectedUsersAndLeagues(
    [...new Set(predictions.map((prediction) => prediction.userId))],
    nowIso
  );

  return {
    tournamentId,
    usersProcessed: predictions.length,
    affectedLeagues
  };
}

export async function rebuildMacroScoring(tournamentId: string, inputResults?: MacroTournamentResults, nowIso = new Date().toISOString()) {
  const existingLogs = await macroScoringLogsRepository.listByTournamentId(tournamentId);
  await macroScoringLogsRepository.deleteByTournamentId(tournamentId);

  const results = await resolveResults(tournamentId, inputResults);
  const predictions = await scorePredictionsWithResults(tournamentId, results, nowIso);
  const affectedUserIds = new Set(existingLogs.map((log) => log.userId));

  for (const prediction of predictions) {
    affectedUserIds.add(prediction.userId);
  }

  const affectedLeagues = await rebuildAffectedUsersAndLeagues([...affectedUserIds], nowIso);

  return {
    tournamentId,
    usersProcessed: predictions.length,
    clearedLogs: existingLogs.length,
    affectedLeagues
  };
}
