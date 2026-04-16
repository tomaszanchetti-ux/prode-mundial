import { ApiError } from "../../../server/errors/api-error";
import { leagueMembersRepository } from "../../leagues/repositories/league-members-repository";
import { rebuildLeagueStandings } from "../../leagues/services/league-standings-builder";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import { championPicksRepository } from "../repositories/macro-picks-repository";
import { championResultsRepository } from "../repositories/macro-results-repository";
import { championScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import { persistChampionScoreForPick } from "./score-macro-prediction";

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

async function resolveOfficialChampion(tournamentId: string, inputChampion?: string): Promise<string> {
  if (inputChampion) {
    return inputChampion;
  }

  const storedResult = await championResultsRepository.getByTournamentId(tournamentId);

  if (!storedResult) {
    throw new ApiError(404, "CHAMPION_RESULT_NOT_FOUND", "Official champion result was not found for this tournament.");
  }

  return storedResult.championTeamId;
}

async function scoreAllPicks(tournamentId: string, officialChampion: string, nowIso: string) {
  const picks = await championPicksRepository.listAll();
  const picksWithChampion = picks.filter((pick) => pick.championTeamId !== null);

  for (const pick of picksWithChampion) {
    await persistChampionScoreForPick(pick, tournamentId, officialChampion, nowIso);
  }

  return picksWithChampion;
}

export async function scoreMacroBatch(
  tournamentId: string,
  inputChampion?: string,
  nowIso = new Date().toISOString()
) {
  const officialChampion = await resolveOfficialChampion(tournamentId, inputChampion);
  const picks = await scoreAllPicks(tournamentId, officialChampion, nowIso);

  const affectedLeagues = await rebuildAffectedUsersAndLeagues(
    [...new Set(picks.map((pick) => pick.userId))],
    nowIso
  );

  return {
    tournamentId,
    usersProcessed: picks.length,
    affectedLeagues
  };
}

export async function rebuildMacroScoring(tournamentId: string, inputChampion?: string, nowIso = new Date().toISOString()) {
  const existingLogs = await championScoringLogsRepository.listByTournamentId(tournamentId);
  await championScoringLogsRepository.deleteByTournamentId(tournamentId);

  const officialChampion = await resolveOfficialChampion(tournamentId, inputChampion);
  const picks = await scoreAllPicks(tournamentId, officialChampion, nowIso);
  const affectedUserIds = new Set(existingLogs.map((log) => log.userId));

  for (const pick of picks) {
    affectedUserIds.add(pick.userId);
  }

  const affectedLeagues = await rebuildAffectedUsersAndLeagues([...affectedUserIds], nowIso);

  return {
    tournamentId,
    usersProcessed: picks.length,
    clearedLogs: existingLogs.length,
    affectedLeagues
  };
}
