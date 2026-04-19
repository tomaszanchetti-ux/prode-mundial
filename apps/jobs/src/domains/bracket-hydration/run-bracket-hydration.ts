/**
 * Resolves FIFA 2026 bracket team slots and persists the result to Firestore.
 *
 * Applies both R32 hydration (group standings → R32 slots) and knock-out
 * propagation (R32 winners → R16 → QF → SF → BRONZE + FINAL) in a single
 * idempotent pass via planFullHydration.
 *
 * Can be invoked:
 *   - automatically at the end of `run-match-sync` (after any match closes);
 *   - manually via `JOB_NAME=bracket-hydration` for recovery or backfills.
 *
 * Idempotent: re-running produces zero patches once everything is wired.
 */

import {
  planFullHydration,
  type GroupDefinition,
  type HydrationMatch,
  type TournamentPhaseUnlocks
} from "@prode/shared";
import { matchSyncMatchesRepository } from "../match-sync/repositories/matches-repository";
import type { SyncStoredMatch } from "../match-sync/types";
import { BRACKET_HYDRATION_GROUPS } from "./groups";

export type BracketHydrationSummary = {
  runAt: string;
  isR32Ready: boolean;
  groupMatchesTotal: number;
  groupMatchesFinalized: number;
  r32PatchesApplied: number;
  knockoutPatchesApplied: number;
  patchesApplied: number;
  phaseUnlocks: TournamentPhaseUnlocks;
  unresolvedSlots: string[];
  appliedMatchIds: string[];
};

function toHydrationMatch(match: SyncStoredMatch): HydrationMatch {
  return {
    matchId: match.matchId,
    stage: match.stage,
    officialMatchNumber: match.officialMatchNumber,
    groupId: match.groupId ?? null,
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

export async function runBracketHydration(
  nowIso = new Date().toISOString(),
  groups: GroupDefinition[] = BRACKET_HYDRATION_GROUPS
): Promise<BracketHydrationSummary> {
  const internalMatches = await matchSyncMatchesRepository.listAllMatches();
  const hydrationMatches = internalMatches.map(toHydrationMatch);

  const plan = planFullHydration(hydrationMatches, groups);

  const appliedMatchIds: string[] = [];

  for (const patch of plan.allPatches) {
    await matchSyncMatchesRepository.updateMatch(patch.matchId, {
      homeTeamId: patch.homeTeamId,
      awayTeamId: patch.awayTeamId,
      updatedAt: nowIso
    });
    appliedMatchIds.push(patch.matchId);
  }

  return {
    runAt: nowIso,
    isR32Ready: plan.phaseUnlocks.r32,
    groupMatchesTotal: plan.groupMatchesTotal,
    groupMatchesFinalized: plan.groupMatchesFinalized,
    r32PatchesApplied: plan.r32Patches.length,
    knockoutPatchesApplied: plan.knockoutPatches.length,
    patchesApplied: appliedMatchIds.length,
    phaseUnlocks: plan.phaseUnlocks,
    unresolvedSlots: plan.unresolvedSlots,
    appliedMatchIds
  };
}
