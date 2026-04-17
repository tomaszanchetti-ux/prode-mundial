import { rebuildAggregatesForUsers } from "../aggregates/run-aggregates-rebuild";
import { runBracketHydration } from "../bracket-hydration/run-bracket-hydration";
import { matchSyncMatchesRepository } from "./repositories/matches-repository";
import { fetchSyncableMatches, mapExternalStatus } from "./services/football-data-client";
import { findInternalMatch, needsUpdate, resolveWinnerTeamId } from "./services/match-sync-logic";
import { scoreMatchPredictions } from "./services/score-match";
import type { MatchSyncExecutionSummary, SyncStoredMatch } from "./types";

export async function runMatchSync(
  nowIso = new Date().toISOString()
): Promise<MatchSyncExecutionSummary> {
  const result: MatchSyncExecutionSummary = {
    syncedAt: nowIso,
    externalMatchesFetched: 0,
    matchesUpdated: 0,
    matchesScored: 0,
    skipped: [],
    errors: []
  };

  const externalMatches = await fetchSyncableMatches();
  result.externalMatchesFetched = externalMatches.length;

  if (externalMatches.length === 0) {
    return result;
  }

  const internalMatches = await matchSyncMatchesRepository.listAllMatches();
  const affectedUserIds = new Set<string>();

  for (const external of externalMatches) {
    const mappedStatus = mapExternalStatus(external.status);

    if (!mappedStatus) {
      result.skipped.push({ externalId: external.id, reason: `Unhandled status: ${external.status}` });
      continue;
    }

    const internal = findInternalMatch(external, internalMatches);

    if (!internal) {
      result.skipped.push({
        externalId: external.id,
        reason: `No internal match for ${external.homeTeam.tla} vs ${external.awayTeam.tla}`
      });
      continue;
    }

    if (internal.isScored) continue;
    if (!needsUpdate(internal, external)) continue;

    const wasGroupFinalization =
      internal.stage === "group" && mappedStatus === "finished" && internal.status !== "finished";

    // Aplicar update
    const winnerTeamId = resolveWinnerTeamId(internal, external, mappedStatus);

    await matchSyncMatchesRepository.updateMatch(internal.matchId, {
      status: mappedStatus,
      homeScore90: external.score.fullTime.home,
      awayScore90: external.score.fullTime.away,
      winnerTeamId,
      isLocked: true,
      sourceProvider: "football-data.org",
      sourceLastSyncedAt: nowIso,
      updatedAt: nowIso
    });

    result.matchesUpdated++;

    // Si finished → trigger scoring
    if (mappedStatus === "finished") {
      try {
        const updatedMatch: SyncStoredMatch = {
          ...internal,
          status: "finished",
          homeScore90: external.score.fullTime.home,
          awayScore90: external.score.fullTime.away,
          winnerTeamId,
          isLocked: true,
          isScored: false,
          updatedAt: nowIso
        };

        const scored = await scoreMatchPredictions(updatedMatch, nowIso);
        result.matchesScored++;
        for (const userId of scored.affectedUserIds) {
          affectedUserIds.add(userId);
        }
        console.log(`Scored ${scored.scoredCount} predictions for ${internal.matchId}`);
      } catch (err) {
        result.errors.push({
          matchId: internal.matchId,
          error: err instanceof Error ? err.message : String(err)
        });
      }

      if (wasGroupFinalization) {
        result.groupMatchesFinalized = (result.groupMatchesFinalized ?? 0) + 1;
      }
    }
  }

  if ((result.groupMatchesFinalized ?? 0) > 0) {
    try {
      const hydration = await runBracketHydration(nowIso);
      result.bracketHydration = {
        isReady: hydration.isReady,
        groupMatchesTotal: hydration.groupMatchesTotal,
        groupMatchesFinalized: hydration.groupMatchesFinalized,
        patchesApplied: hydration.patchesApplied,
        unresolvedSlots: hydration.unresolvedSlots,
        appliedMatchIds: hydration.appliedMatchIds
      };
      if (hydration.patchesApplied > 0) {
        console.log(
          `Bracket hydration applied ${hydration.patchesApplied} R32 patches: ${hydration.appliedMatchIds.join(", ")}`
        );
      }
    } catch (err) {
      result.errors.push({
        matchId: "bracket-hydration",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  if (affectedUserIds.size > 0) {
    try {
      const rebuild = await rebuildAggregatesForUsers([...affectedUserIds], nowIso);
      result.aggregatesRebuild = rebuild;

      if (rebuild.errors.length > 0) {
        for (const err of rebuild.errors) {
          result.errors.push({ matchId: err.scope, error: err.error });
        }
      }

      console.log(
        `Aggregates rebuilt: ${rebuild.usersRebuilt} users, ${rebuild.leaguesRebuilt} leagues`
      );
    } catch (err) {
      result.errors.push({
        matchId: "aggregates-rebuild",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return result;
}
