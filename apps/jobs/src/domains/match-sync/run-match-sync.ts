import { rebuildAggregatesForUsers } from "../aggregates/run-aggregates-rebuild";
import { runBracketHydration } from "../bracket-hydration/run-bracket-hydration";
import { matchSyncMatchesRepository } from "./repositories/matches-repository";
import { fetchSyncableMatches, mapExternalStatus, resolveScore90 } from "./services/football-data-client";
import { decideSyncAction, findInternalMatch, resolveWinnerTeamId } from "./services/match-sync-logic";
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
    matchesCorrected: 0,
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

    const decision = decideSyncAction(internal, external);
    if (decision.action === "skip") continue;

    const { hasUpdate, rescore: isCorrection } = decision;

    const wasGroupFinalization =
      internal.stage === "group" && mappedStatus === "finished" && internal.status !== "finished";

    const score90 = resolveScore90(external);
    const winnerTeamId = resolveWinnerTeamId(internal, external, mappedStatus);

    if (hasUpdate) {
      await matchSyncMatchesRepository.updateMatch(internal.matchId, {
        status: mappedStatus,
        homeScore90: score90.home,
        awayScore90: score90.away,
        winnerTeamId,
        isLocked: true,
        sourceProvider: "football-data.org",
        sourceLastSyncedAt: nowIso,
        updatedAt: nowIso
      });

      result.matchesUpdated++;
    }

    // Si finished → trigger scoring
    if (mappedStatus === "finished") {
      try {
        const updatedMatch: SyncStoredMatch = {
          ...internal,
          status: "finished",
          homeScore90: score90.home,
          awayScore90: score90.away,
          winnerTeamId,
          isLocked: true,
          isScored: false,
          updatedAt: nowIso
        };

        const scored = await scoreMatchPredictions(updatedMatch, nowIso, { rescore: isCorrection });
        result.matchesScored++;
        for (const userId of scored.affectedUserIds) {
          affectedUserIds.add(userId);
        }

        if (isCorrection) {
          // Auto-corrección: la fuente cambió un resultado ya puntuado. Lo dejamos
          // en el log (mueve puntos post-final) para que quede rastro auditable.
          result.matchesCorrected = (result.matchesCorrected ?? 0) + 1;
          console.warn(
            `[CORRECTION] ${internal.matchId} re-scored from feed correction: ` +
              `${internal.homeScore90}-${internal.awayScore90} → ${score90.home}-${score90.away} ` +
              `(${scored.scoredCount} predictions)`
          );
        } else {
          console.log(`Scored ${scored.scoredCount} predictions for ${internal.matchId}`);
        }
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

  // Fire hydration whenever any match just finished (group or knock-out).
  // The planner is idempotent, so a no-op run is harmless and cheap.
  if (result.matchesScored > 0) {
    try {
      const hydration = await runBracketHydration(nowIso);
      result.bracketHydration = {
        isR32Ready: hydration.isR32Ready,
        groupMatchesTotal: hydration.groupMatchesTotal,
        groupMatchesFinalized: hydration.groupMatchesFinalized,
        r32PatchesApplied: hydration.r32PatchesApplied,
        knockoutPatchesApplied: hydration.knockoutPatchesApplied,
        patchesApplied: hydration.patchesApplied,
        phaseUnlocks: hydration.phaseUnlocks,
        unresolvedSlots: hydration.unresolvedSlots,
        appliedMatchIds: hydration.appliedMatchIds
      };
      if (hydration.patchesApplied > 0) {
        console.log(
          `Bracket hydration applied ${hydration.patchesApplied} patches ` +
            `(R32: ${hydration.r32PatchesApplied}, knockout: ${hydration.knockoutPatchesApplied}): ` +
            hydration.appliedMatchIds.join(", ")
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
