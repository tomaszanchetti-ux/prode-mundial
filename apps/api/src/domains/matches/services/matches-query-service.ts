import type { ListMatchesQuery, ListMatchesResponse, MatchDetail } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { matchesRepository } from "../repositories/matches-repository";
import { predictionsRepository } from "../repositories/predictions-repository";
import { teamsRepository } from "../repositories/teams-repository";
import {
  applyMatchesCursor,
  buildTournamentContext,
  encodeMatchesCursor,
  toMatchDetail,
  toMatchSummary,
  type TournamentContext
} from "./match-payloads";

function collectTeamIdsFromMatches(matches: Awaited<ReturnType<typeof matchesRepository.listMatches>>) {
  return matches.flatMap((match) => [match.homeTeamId, match.awayTeamId].filter((teamId): teamId is string => Boolean(teamId)));
}

async function loadTournamentContext(
  preloaded: Awaited<ReturnType<typeof matchesRepository.listMatches>> | null
): Promise<TournamentContext> {
  const all = preloaded ?? (await matchesRepository.listMatches({}));
  return buildTournamentContext(all);
}

function filterSummaries(items: ReturnType<typeof toMatchSummary>[], filter: ListMatchesQuery["filter"], now = new Date()) {
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

  if (filter === "pending") {
    return items.filter((item) => item.isEditable && item.predictionStatus === "empty");
  }

  if (filter === "scored") {
    return items.filter((item) => item.predictionStatus === "scored");
  }

  if (filter === "finished") {
    return items.filter((item) => item.status === "finished");
  }

  return items;
}

export class MatchesQueryService {
  async listMatchesForUser(userId: string, query: ListMatchesQuery = {}, now = new Date()): Promise<ListMatchesResponse> {
    const matches = await matchesRepository.listMatches({ stage: query.stage });
    const predictionsByMatchId = await predictionsRepository.listPredictionsByUserForMatches(
      userId,
      matches.map((match) => match.matchId)
    );
    const teamsById = await teamsRepository.getTeamsByIds(collectTeamIdsFromMatches(matches));
    const context = await loadTournamentContext(query.stage ? null : matches);

    const summaries = matches.map((match) =>
      toMatchSummary(match, predictionsByMatchId.get(match.matchId) ?? null, teamsById, now, context)
    );
    const filteredSummaries = filterSummaries(summaries, query.filter, now);
    const cursorApplied = applyMatchesCursor(filteredSummaries, query.cursor);
    const limit = query.limit ?? 20;
    const pagedItems = cursorApplied.slice(0, limit);
    const nextCursor =
      cursorApplied.length > limit && pagedItems.length > 0
        ? encodeMatchesCursor(pagedItems[pagedItems.length - 1])
        : null;

    return {
      items: pagedItems,
      nextCursor
    };
  }

  async getMatchDetailForUser(userId: string, matchId: string, now = new Date()): Promise<MatchDetail> {
    const match = await matchesRepository.getMatchById(matchId);

    if (!match) {
      throw new ApiError(404, "MATCH_NOT_FOUND", `Match ${matchId} was not found.`, { matchId });
    }

    const prediction = await predictionsRepository.getPredictionByUserAndMatch(userId, matchId);
    const teamsById = await teamsRepository.getTeamsByIds(
      [match.homeTeamId, match.awayTeamId].filter((teamId): teamId is string => Boolean(teamId))
    );
    const context = await loadTournamentContext(null);

    return toMatchDetail(match, prediction, teamsById, now, context);
  }
}

export const matchesQueryService = new MatchesQueryService();
