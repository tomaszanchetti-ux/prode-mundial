/**
 * Resolves the top-8 third-placed teams across the 12 FIFA 2026 groups.
 *
 * Input: a standings row per third-placed team (one per group, 12 total),
 * already computed from finalized/projected group matches.
 *
 * Output: the 12 thirds ordered by FIFA tie-break rules, and the top 8 that
 * advance to the Round of 32.
 *
 * Tie-break order (simplified subset of FIFA 2026):
 *   1. points (desc)
 *   2. goal difference (desc)
 *   3. goals scored (desc)
 *   4. teamName lexicographic (asc) — deterministic stand-in for fair play
 *      points and drawing of lots, both unavailable in this app.
 */

export type ThirdPlaceCandidate = {
  groupId: string;
  teamId: string;
  teamName: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
};

export type RankedThirdPlace = ThirdPlaceCandidate & {
  rank: number;
  advances: boolean;
};

export type BestThirdsResolution = {
  ranked: RankedThirdPlace[];
  top8: RankedThirdPlace[];
  advancingGroupIds: string[];
};

const ADVANCING_SLOTS = 8;

function compareCandidates(left: ThirdPlaceCandidate, right: ThirdPlaceCandidate): number {
  if (left.points !== right.points) {
    return right.points - left.points;
  }

  if (left.goalDifference !== right.goalDifference) {
    return right.goalDifference - left.goalDifference;
  }

  if (left.goalsFor !== right.goalsFor) {
    return right.goalsFor - left.goalsFor;
  }

  return left.teamName.localeCompare(right.teamName);
}

export function resolveBestThirds(candidates: ThirdPlaceCandidate[]): BestThirdsResolution {
  const ordered = [...candidates].sort(compareCandidates);

  const ranked: RankedThirdPlace[] = ordered.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    advances: index < ADVANCING_SLOTS
  }));

  const top8 = ranked.filter((row) => row.advances);

  return {
    ranked,
    top8,
    advancingGroupIds: top8.map((row) => row.groupId)
  };
}
