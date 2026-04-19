/**
 * Composes group→R32 hydration (planBracketHydration) with knock-out→knock-out
 * propagation (planKnockoutHydration) into a single plan.
 *
 * Used by the bracket-hydration job and by projection services that want a
 * single source of truth for "what's hydratable right now" plus which phases
 * of prediction input should be unlocked in the UI.
 *
 * Pure — returns patches and flags, never touches storage.
 *
 * Composition note: when the R32 planner produces patches, this wrapper
 * projects them in-memory before running the knock-out planner. That way a
 * single call can emit both sets of patches correctly even during backfill.
 * In steady-state real-time operation this rarely matters (rounds close
 * days apart), but it keeps the planner robust for manual recovery runs.
 */

import {
  planBracketHydration,
  type BracketHydrationPatch,
  type HydrationMatch
} from "./bracket-hydration";
import { planKnockoutHydration } from "./knockout-hydration-resolver";
import type { GroupDefinition } from "./official-standings";

export type PhaseUnlocks = {
  /** Group-stage predictions are always open before their own kickoff. */
  groups: true;
  /** R32 predictions unlock once every group match has a 90' score. */
  r32: boolean;
  /** R16 predictions unlock once every R32 match has a winnerTeamId. */
  r16: boolean;
  qf: boolean;
  sf: boolean;
  bronzeFinal: boolean;
};

export type FullHydrationPlan = {
  r32Patches: BracketHydrationPatch[];
  knockoutPatches: BracketHydrationPatch[];
  allPatches: BracketHydrationPatch[];
  phaseUnlocks: PhaseUnlocks;
  unresolvedSlots: string[];
  groupMatchesTotal: number;
  groupMatchesFinalized: number;
  r32MatchesTotal: number;
};

function projectMatchesWithPatches(
  matches: HydrationMatch[],
  patches: BracketHydrationPatch[]
): HydrationMatch[] {
  if (patches.length === 0) {
    return matches;
  }

  const patchByMatchId = new Map(patches.map((patch) => [patch.matchId, patch]));

  return matches.map((match) => {
    const patch = patchByMatchId.get(match.matchId);

    if (!patch) {
      return match;
    }

    return {
      ...match,
      homeTeamId: patch.homeTeamId,
      awayTeamId: patch.awayTeamId
    };
  });
}

export function planFullHydration(
  matches: HydrationMatch[],
  groups: GroupDefinition[]
): FullHydrationPlan {
  const r32Plan = planBracketHydration(matches, groups);

  const projectedMatches = projectMatchesWithPatches(matches, r32Plan.patches);
  const knockoutPlan = planKnockoutHydration(projectedMatches);

  const phaseUnlocks: PhaseUnlocks = {
    groups: true,
    r32: r32Plan.isReady,
    r16: knockoutPlan.phaseReady.r16,
    qf: knockoutPlan.phaseReady.qf,
    sf: knockoutPlan.phaseReady.sf,
    bronzeFinal: knockoutPlan.phaseReady.bronzeFinal
  };

  return {
    r32Patches: r32Plan.patches,
    knockoutPatches: knockoutPlan.patches,
    allPatches: [...r32Plan.patches, ...knockoutPlan.patches],
    phaseUnlocks,
    unresolvedSlots: [...r32Plan.unresolvedSlots, ...knockoutPlan.unresolvedSlots],
    groupMatchesTotal: r32Plan.groupMatchesTotal,
    groupMatchesFinalized: r32Plan.groupMatchesFinalized,
    r32MatchesTotal: r32Plan.r32MatchesTotal
  };
}
