/**
 * Resolves the FIFA 2026 Round of 32 matchups from resolved group standings.
 *
 * Each R32 match in the seed JSON carries `homeSlot` / `awaySlot` strings:
 *   - "1A", "1B", … → winner of group A, B, …
 *   - "2A", "2B", … → runner-up of group A, B, …
 *   - "3ABCDF" …   → one of the 8 best third-placed teams, from the groups
 *                    listed inside the slot (FIFA publishes a 495-row lookup
 *                    that dictates exactly which third goes to which slot;
 *                    we approximate it with a deterministic bipartite match).
 *
 * The resolver is pure: it takes group standings + R32 slot definitions and
 * returns which teamId goes on each side. Callers (official pipeline or
 * projection service) decide how to persist or render the result.
 *
 * TODO(FIFA-lookup): replace the greedy matcher in `matchThirdsToSlots` with
 * FIFA's official 495-row table when it is published for 2026. The rest of
 * this file is final.
 */

import { resolveBestThirds, type ThirdPlaceCandidate, type RankedThirdPlace } from "./best-thirds-resolver";

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

function parseThirdSlotCandidateGroups(slot: string): string[] {
  return slot.slice(1).split("");
}

/**
 * Deterministic greedy matching. Order matters and is chosen to minimise
 * conflicts with the official FIFA lookup for the common advancement
 * patterns: slots with the fewest candidate groups are resolved first, and
 * inside each slot the best-ranked still-unassigned third is picked.
 */
function matchThirdsToSlots(
  thirdSlots: { slot: string; candidateGroups: string[] }[],
  bestThirds: RankedThirdPlace[]
): Map<string, string | null> {
  const advancingByGroupId = new Map<string, RankedThirdPlace>();

  for (const third of bestThirds) {
    advancingByGroupId.set(third.groupId, third);
  }

  const slotsToResolve = [...thirdSlots].sort((left, right) => {
    const leftAvailable = left.candidateGroups.filter((groupId) => advancingByGroupId.has(groupId)).length;
    const rightAvailable = right.candidateGroups.filter((groupId) => advancingByGroupId.has(groupId)).length;

    if (leftAvailable !== rightAvailable) {
      return leftAvailable - rightAvailable;
    }

    return left.slot.localeCompare(right.slot);
  });

  const assignedGroupIds = new Set<string>();
  const slotToTeamId = new Map<string, string | null>();

  for (const { slot, candidateGroups } of slotsToResolve) {
    const eligible = candidateGroups
      .map((groupId) => advancingByGroupId.get(groupId))
      .filter((third): third is RankedThirdPlace => Boolean(third) && !assignedGroupIds.has(third!.groupId))
      .sort((left, right) => left.rank - right.rank);

    const pick = eligible[0];

    if (!pick) {
      slotToTeamId.set(slot, null);
      continue;
    }

    slotToTeamId.set(slot, pick.teamId);
    assignedGroupIds.add(pick.groupId);
  }

  return slotToTeamId;
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

  const thirdSlotInputs = slotDefinitions
    .flatMap((definition) => [
      { slot: definition.homeSlot },
      { slot: definition.awaySlot }
    ])
    .filter(({ slot }) => slot.startsWith(THIRD_PREFIX))
    .reduce<{ slot: string; candidateGroups: string[] }[]>((accumulator, { slot }) => {
      if (!accumulator.some((existing) => existing.slot === slot)) {
        accumulator.push({ slot, candidateGroups: parseThirdSlotCandidateGroups(slot) });
      }
      return accumulator;
    }, []);

  const thirdsSlotToTeamId = matchThirdsToSlots(thirdSlotInputs, top8);

  const resolveSlot = (slot: string): string | null => {
    if (slot.startsWith(THIRD_PREFIX)) {
      return thirdsSlotToTeamId.get(slot) ?? null;
    }

    return resolveFixedSlot(slot, standingsByGroupId);
  };

  const matches: ResolvedR32Match[] = slotDefinitions.map((definition) => ({
    matchId: definition.matchId,
    homeSlot: definition.homeSlot,
    awaySlot: definition.awaySlot,
    homeTeamId: resolveSlot(definition.homeSlot),
    awayTeamId: resolveSlot(definition.awaySlot)
  }));

  const unresolvedSlots: string[] = [];

  for (const match of matches) {
    if (match.homeTeamId === null) {
      unresolvedSlots.push(match.homeSlot);
    }
    if (match.awayTeamId === null) {
      unresolvedSlots.push(match.awaySlot);
    }
  }

  const thirdsBySlot: Record<string, string | null> = {};

  for (const { slot } of thirdSlotInputs) {
    thirdsBySlot[slot] = thirdsSlotToTeamId.get(slot) ?? null;
  }

  return {
    matches,
    bestThirds: ranked,
    thirdsBySlot,
    unresolvedSlots
  };
}
