/**
 * Resolves the FIFA 2026 Round of 32 matchups from resolved group standings.
 *
 * Each R32 match in the seed JSON carries `homeSlot` / `awaySlot` strings:
 *   - "1A", "1B", … → winner of group A, B, …
 *   - "2A", "2B", … → runner-up of group A, B, …
 *   - "3ABCDF" …    → one of the 8 best third-placed teams. Which third lands
 *                     in this slot depends on the *whole* set of eight groups
 *                     whose third advances, per FIFA's official 495-row table
 *                     (Annex C of the tournament regulations).
 *
 * The resolver is pure: it takes group standings + R32 slot definitions and
 * returns which teamId goes on each side. Callers (official pipeline or
 * projection service) decide how to persist or render the result.
 *
 * Third-place allocation uses the official lookup table
 * (`FIFA_2026_R32_THIRD_ALLOCATION`). It replaced an earlier greedy matcher
 * that resolved slots independently and could strand a qualified third — which
 * left a slot empty and a third unplaced. The allocation cannot be resolved
 * slot-by-slot; it depends on the full combination of advancing groups.
 */

import { resolveBestThirds, type ThirdPlaceCandidate, type RankedThirdPlace } from "./best-thirds-resolver";
import { FIFA_2026_R32_THIRD_ALLOCATION } from "./fifa-2026-r32-third-allocation";

export type GroupStandingPosition = {
  position: 1 | 2 | 3;
  teamId: string;
  teamName: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
};

export type ResolvedGroupStandings = {
  groupId: string;
  positions: GroupStandingPosition[];
};

export type R32SlotDefinition = {
  matchId: string;
  homeSlot: string;
  awaySlot: string;
};

export type ResolvedR32Match = {
  matchId: string;
  homeSlot: string;
  awaySlot: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type R32BracketResolution = {
  matches: ResolvedR32Match[];
  bestThirds: RankedThirdPlace[];
  thirdsBySlot: Record<string, string | null>;
  unresolvedSlots: string[];
};

const WINNER_PREFIX = "1";
const RUNNERUP_PREFIX = "2";
const THIRD_PREFIX = "3";
const ADVANCING_THIRDS = 8;

function indexByGroupId(standings: ResolvedGroupStandings[]): Map<string, ResolvedGroupStandings> {
  const map = new Map<string, ResolvedGroupStandings>();

  for (const group of standings) {
    map.set(group.groupId, group);
  }

  return map;
}

function resolveFixedSlot(
  slot: string,
  standingsByGroupId: Map<string, ResolvedGroupStandings>
): string | null {
  const prefix = slot.slice(0, 1);
  const groupId = slot.slice(1);
  const group = standingsByGroupId.get(groupId);

  if (!group) {
    return null;
  }

  const targetPosition = prefix === WINNER_PREFIX ? 1 : prefix === RUNNERUP_PREFIX ? 2 : null;

  if (!targetPosition) {
    return null;
  }

  const row = group.positions.find((position) => position.position === targetPosition);

  return row?.teamId ?? null;
}

/**
 * Looks up the official third-place allocation for the current combination of
 * advancing groups and returns, per group-winner letter, the teamId of the
 * third-placed team it must face. Returns an empty map (no thirds resolvable)
 * when fewer than eight thirds have advanced, or when the combination is not
 * in the table (which should never happen for a valid eight-group set).
 */
function resolveThirdsByWinnerGroup(
  top8: RankedThirdPlace[],
  standingsByGroupId: Map<string, ResolvedGroupStandings>
): Map<string, string | null> {
  const byWinnerGroup = new Map<string, string | null>();

  if (top8.length !== ADVANCING_THIRDS) {
    return byWinnerGroup;
  }

  const advancingGroupIds = top8.map((third) => third.groupId);
  const combinationKey = [...advancingGroupIds].sort().join("");
  const allocation = FIFA_2026_R32_THIRD_ALLOCATION[combinationKey];

  if (!allocation) {
    return byWinnerGroup;
  }

  const thirdTeamIdByGroup = new Map<string, string>();
  for (const third of top8) {
    thirdTeamIdByGroup.set(third.groupId, third.teamId);
  }

  for (const [winnerGroupId, thirdGroupId] of Object.entries(allocation)) {
    byWinnerGroup.set(winnerGroupId, thirdTeamIdByGroup.get(thirdGroupId) ?? null);
  }

  return byWinnerGroup;
}

export function resolveR32Bracket(
  standings: ResolvedGroupStandings[],
  slotDefinitions: R32SlotDefinition[]
): R32BracketResolution {
  const standingsByGroupId = indexByGroupId(standings);

  const thirdsCandidates: ThirdPlaceCandidate[] = standings
    .map((group) => {
      const third = group.positions.find((position) => position.position === 3);

      if (!third) {
        return null;
      }

      return {
        groupId: group.groupId,
        teamId: third.teamId,
        teamName: third.teamName,
        points: third.points,
        goalDifference: third.goalDifference,
        goalsFor: third.goalsFor
      } satisfies ThirdPlaceCandidate;
    })
    .filter((candidate): candidate is ThirdPlaceCandidate => candidate !== null);

  const { ranked, top8 } = resolveBestThirds(thirdsCandidates);

  const thirdsByWinnerGroup = resolveThirdsByWinnerGroup(top8, standingsByGroupId);

  // A "3..." slot is always paired, within its match, with the winner of a
  // group ("1X"). The official table is keyed by that winner, so resolving a
  // third slot needs its partner slot for context.
  const resolveThirdSlot = (winnerSlot: string): string | null => {
    if (winnerSlot.slice(0, 1) !== WINNER_PREFIX) {
      return null;
    }

    const winnerGroupId = winnerSlot.slice(1);

    // No match without a resolvable winner → leave the third unresolved too.
    if (!standingsByGroupId.has(winnerGroupId)) {
      return null;
    }

    return thirdsByWinnerGroup.get(winnerGroupId) ?? null;
  };

  const resolveSide = (slot: string, otherSlot: string): string | null => {
    if (slot.startsWith(THIRD_PREFIX)) {
      return resolveThirdSlot(otherSlot);
    }

    return resolveFixedSlot(slot, standingsByGroupId);
  };

  const matches: ResolvedR32Match[] = slotDefinitions.map((definition) => ({
    matchId: definition.matchId,
    homeSlot: definition.homeSlot,
    awaySlot: definition.awaySlot,
    homeTeamId: resolveSide(definition.homeSlot, definition.awaySlot),
    awayTeamId: resolveSide(definition.awaySlot, definition.homeSlot)
  }));

  const thirdsBySlot: Record<string, string | null> = {};

  for (const match of matches) {
    if (match.homeSlot.startsWith(THIRD_PREFIX)) {
      thirdsBySlot[match.homeSlot] = match.homeTeamId;
    }
    if (match.awaySlot.startsWith(THIRD_PREFIX)) {
      thirdsBySlot[match.awaySlot] = match.awayTeamId;
    }
  }

  const unresolvedSlots: string[] = [];

  for (const match of matches) {
    if (match.homeTeamId === null) {
      unresolvedSlots.push(match.homeSlot);
    }
    if (match.awayTeamId === null) {
      unresolvedSlots.push(match.awaySlot);
    }
  }

  return {
    matches,
    bestThirds: ranked,
    thirdsBySlot,
    unresolvedSlots
  };
}
