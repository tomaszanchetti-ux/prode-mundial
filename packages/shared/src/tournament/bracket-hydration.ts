/**
 * Plans the hydration of Round-of-32 matches from a full set of matches plus
 * group definitions.
 *
 * "Hydration" = computing which teamId belongs on each side of each R32
 * match, based on finalized group standings and the seed slot definitions
 * ("1A", "2B", "3ABCDF", …).
 *
 * The planner is pure — it returns patches without touching any storage.
 * Callers (job wiring in apps/jobs or an admin endpoint in apps/api) decide
 * whether to apply them.
 *
 * Readiness: R32 cannot be resolved until every group match has a
 * 90-minute score. If any match is still missing, readiness is reported as
 * false and no patches are produced.
 */

import {
  resolveR32Bracket,
  type ResolvedGroupStandings,
  type R32SlotDefinition
} from "./r32-bracket-resolver";
import { computeGroupStandings, type GroupDefinition, type GroupMatchResult } from "./official-standings";

export type HydrationMatch = {
  matchId: string;
  stage: string;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSlot?: string | null;
  awaySlot?: string | null;
  homeScore90: number | null;
  awayScore90: number | null;
  status: string;
};

export type BracketHydrationPatch = {
  matchId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type BracketHydrationPlan = {
  isReady: boolean;
  groupMatchesTotal: number;
  groupMatchesFinalized: number;
  standings: ResolvedGroupStandings[];
  patches: BracketHydrationPatch[];
  unresolvedSlots: string[];
  r32MatchesTotal: number;
};

const GROUP_STAGE = "group";
const R32_STAGE = "R32";

function isFinalized(match: HydrationMatch): boolean {
  return match.homeScore90 !== null && match.awayScore90 !== null;
}

function toGroupMatchResult(match: HydrationMatch): GroupMatchResult | null {
  if (!match.groupId || !match.homeTeamId || !match.awayTeamId) {
    return null;
  }

  if (match.homeScore90 === null || match.awayScore90 === null) {
    return null;
  }

  return {
    matchId: match.matchId,
    groupId: match.groupId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore: match.homeScore90,
    awayScore: match.awayScore90
  };
}

function toR32SlotDefinition(match: HydrationMatch): R32SlotDefinition | null {
  if (!match.homeSlot || !match.awaySlot) {
    return null;
  }

  return {
    matchId: match.matchId,
    homeSlot: match.homeSlot,
    awaySlot: match.awaySlot
  };
}

function buildPatchForCurrentState(
  match: HydrationMatch,
  resolvedHome: string | null,
  resolvedAway: string | null
): BracketHydrationPatch | null {
  const homeChanged = resolvedHome !== null && resolvedHome !== match.homeTeamId;
  const awayChanged = resolvedAway !== null && resolvedAway !== match.awayTeamId;

  if (!homeChanged && !awayChanged) {
    return null;
  }

  return {
    matchId: match.matchId,
    homeTeamId: homeChanged ? resolvedHome : match.homeTeamId,
    awayTeamId: awayChanged ? resolvedAway : match.awayTeamId
  };
}

export function planBracketHydration(
  matches: HydrationMatch[],
  groups: GroupDefinition[]
): BracketHydrationPlan {
  const groupMatches = matches.filter((match) => match.stage === GROUP_STAGE);
  const r32Matches = matches.filter((match) => match.stage === R32_STAGE);

  const groupMatchesTotal = groupMatches.length;
  const groupMatchesFinalized = groupMatches.filter(isFinalized).length;
  const r32MatchesTotal = r32Matches.length;

  const isReady = groupMatchesTotal > 0 && groupMatchesFinalized === groupMatchesTotal;

  if (!isReady) {
    return {
      isReady: false,
      groupMatchesTotal,
      groupMatchesFinalized,
      standings: [],
      patches: [],
      unresolvedSlots: [],
      r32MatchesTotal
    };
  }

  const groupResults = groupMatches
    .map(toGroupMatchResult)
    .filter((result): result is GroupMatchResult => result !== null);

  const standings = computeGroupStandings(groups, groupResults);

  const slotDefinitions = r32Matches
    .map(toR32SlotDefinition)
    .filter((definition): definition is R32SlotDefinition => definition !== null);

  const { matches: resolvedR32, unresolvedSlots } = resolveR32Bracket(standings, slotDefinitions);
  const resolvedByMatchId = new Map(resolvedR32.map((match) => [match.matchId, match]));

  const patches: BracketHydrationPatch[] = [];

  for (const match of r32Matches) {
    const resolved = resolvedByMatchId.get(match.matchId);

    if (!resolved) {
      continue;
    }

    const patch = buildPatchForCurrentState(match, resolved.homeTeamId, resolved.awayTeamId);

    if (patch) {
      patches.push(patch);
    }
  }

  return {
    isReady: true,
    groupMatchesTotal,
    groupMatchesFinalized,
    standings,
    patches,
    unresolvedSlots,
    r32MatchesTotal
  };
}
