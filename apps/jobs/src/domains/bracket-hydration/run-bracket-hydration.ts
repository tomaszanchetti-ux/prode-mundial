/**
 * Resolves FIFA 2026 R32 team slots once every group match is finalized and
 * persists the result back to Firestore.
 *
 * Can be invoked:
 *   - automatically at the end of `run-match-sync` (when group matches just
 *     closed);
 *   - manually via `JOB_NAME=bracket-hydration` for recovery or backfills.
 *
 * Idempotent: re-running produces zero patches once everything is wired.
 */

import {
  planBracketHydration,
  type GroupDefinition,
  type HydrationMatch
} from "@prode/shared";
import { matchSyncMatchesRepository } from "../match-sync/repositories/matches-repository";
import type { SyncStoredMatch } from "../match-sync/types";
import { BRACKET_HYDRATION_GROUPS } from "./groups";

export type BracketHydrationSummary = {
  runAt: string;
  isReady: boolean;
  groupMatchesTotal: number;
  groupMatchesFinalized: number;
  patchesApplied: number;
  unresolvedSlots: string[];
  appliedMatchIds: string[];
};

function toHydrationMatch(match: SyncStoredMatch): HydrationMatch {
  return {
    matchId: match.matchId,
    stage: match.stage,
    groupId: match.groupId ?? null,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeSlot: match.homeSlot ?? null,
    awaySlot: match.awaySlot ?? null,
    homeScore90: match.homeScore90,
    awayScore90: match.awayScore90,
    status: match.status
  };
}

export async function runBracketHydration(
  nowIso = new Date().toISOString(),
  groups: GroupDefinition[] = BRACKET_HYDRATION_GROUPS
): Promise<BracketHydrationSummary> {
  const internalMatches = await matchSyncMatchesRepository.listAllMatches();
  const hydrationMatches = internalMatches.map(toHydrationMatch);

  const plan = planBracketHydration(hydrationMatches, groups);

  const appliedMatchIds: string[] = [];

  for (const patch of plan.patches) {
    await matchSyncMatchesRepository.updateMatch(patch.matchId, {
      homeTeamId: patch.homeTeamId,
      awayTeamId: patch.awayTeamId,
      updatedAt: nowIso
    });
    appliedMatchIds.push(patch.matchId);
  }

  return {
    runAt: nowIso,
    isReady: plan.isReady,
    groupMatchesTotal: plan.groupMatchesTotal,
    groupMatchesFinalized: plan.groupMatchesFinalized,
    patchesApplied: appliedMatchIds.length,
    unresolvedSlots: plan.unresolvedSlots,
    appliedMatchIds
  };
}
