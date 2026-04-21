import type { TournamentProjectionBracket, TournamentProjectionMatch } from "../contracts/tournament";

/**
 * Bracket halves — pure topology analysis for a TournamentProjectionBracket.
 *
 * The bracket splits in two "halves" at the Final:
 *   - Half A → teams whose path leads to SF1 (home of the Final).
 *   - Half B → teams whose path leads to SF2 (away of the Final).
 *   - neutral → Final itself and the Bronze match (cross-half).
 *
 * This module derives that classification from the slotLabels inside each
 * match (`M{N}` back-references) and exposes helpers used by:
 *   - the visual bracket (tinting half A blue / half B violet),
 *   - the EPIC 17 sub-champion validator (must be in opposite half).
 */

export type BracketHalf = "A" | "B" | "neutral";

export type SubChampionValidationReason =
  | "SAME_TEAM"
  | "SAME_HALF"
  | "UNRESOLVED_HALF";

export type SubChampionValidationResult =
  | { valid: true }
  | { valid: false; reason: SubChampionValidationReason };

function parseSourceMatchNumber(label: string): number | null {
  const m = /M(\d+)/.exec(label);
  return m ? Number.parseInt(m[1], 10) : null;
}

function buildMatchByNumber(
  bracket: TournamentProjectionBracket
): Map<number, TournamentProjectionMatch> {
  const map = new Map<number, TournamentProjectionMatch>();
  const all = [
    ...bracket.round32,
    ...bracket.round16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...bracket.bronze,
    ...bracket.final
  ];
  for (const m of all) {
    if (typeof m.officialMatchNumber === "number") {
      map.set(m.officialMatchNumber, m);
    }
  }
  return map;
}

function feedersOf(
  match: TournamentProjectionMatch,
  byNumber: Map<number, TournamentProjectionMatch>
): TournamentProjectionMatch[] {
  const out: TournamentProjectionMatch[] = [];
  const h = parseSourceMatchNumber(match.home.slotLabel);
  if (h !== null) {
    const feeder = byNumber.get(h);
    if (feeder) out.push(feeder);
  }
  const a = parseSourceMatchNumber(match.away.slotLabel);
  if (a !== null) {
    const feeder = byNumber.get(a);
    if (feeder) out.push(feeder);
  }
  return out;
}

/**
 * Assigns every knock-out match a half (A / B / neutral) by walking upstream
 * from the Final. The two SF feeders of the Final seed halves A and B; every
 * feeder-chain rooted at one of them inherits that half. Final + Bronze stay
 * neutral (they cross halves).
 *
 * Returns `matchId → half`. Matches not reachable from the Final (e.g.
 * partial projection) are simply absent from the map.
 */
export function classifyMatchBracketHalves(
  bracket: TournamentProjectionBracket
): Map<string, BracketHalf> {
  const sideById = new Map<string, BracketHalf>();
  const byNumber = buildMatchByNumber(bracket);

  const finalMatch = bracket.final[0];
  if (!finalMatch) return sideById;

  const sfs = feedersOf(finalMatch, byNumber);
  if (sfs.length === 2) {
    sideById.set(sfs[0].matchId, "A");
    sideById.set(sfs[1].matchId, "B");
  }

  const walkDown = (parents: TournamentProjectionMatch[]) => {
    const nextLevel: TournamentProjectionMatch[] = [];
    for (const parent of parents) {
      const side = sideById.get(parent.matchId) ?? "neutral";
      for (const child of feedersOf(parent, byNumber)) {
        if (side !== "neutral") sideById.set(child.matchId, side);
        nextLevel.push(child);
      }
    }
    return nextLevel;
  };

  let level: TournamentProjectionMatch[] = sfs;
  for (let depth = 0; depth < 3 && level.length > 0; depth += 1) {
    level = walkDown(level);
  }

  sideById.set(finalMatch.matchId, "neutral");
  for (const b of bracket.bronze) sideById.set(b.matchId, "neutral");

  return sideById;
}

/**
 * Maps each team currently assigned to an R32 match to its bracket half.
 * Derived from `classifyMatchBracketHalves` — both sides of an R32 match
 * inherit the match's half. Teams in unresolved R32 slots (no team assigned
 * yet) are skipped.
 *
 * In windows A and B the bracket is projected from the user's predictions;
 * the R32 assignments drive team-to-half mapping. If a team isn't in R32 yet
 * (e.g. user hasn't finished group predictions, or third-place advance not
 * resolved), it will be missing from the result.
 */
export function classifyTeamBracketHalves(
  bracket: TournamentProjectionBracket
): Map<string, BracketHalf> {
  const matchHalves = classifyMatchBracketHalves(bracket);
  const teamHalves = new Map<string, BracketHalf>();
  for (const match of bracket.round32) {
    const half = matchHalves.get(match.matchId);
    if (!half || half === "neutral") continue;
    const homeId = match.home.team?.teamId;
    const awayId = match.away.team?.teamId;
    if (homeId) teamHalves.set(homeId, half);
    if (awayId) teamHalves.set(awayId, half);
  }
  return teamHalves;
}

/**
 * Validates a Sub-Champion pick against the user's Champion pick, using the
 * team-to-half map derived from their current bracket projection.
 *
 * Rules (EPIC 17):
 *   1. Sub-champion must be a DIFFERENT team than the champion.
 *   2. Both teams must be resolvable to a non-neutral half.
 *   3. The two teams must be in OPPOSITE halves of the bracket.
 *
 * Returning `{ valid: true }` does NOT imply "the user will win 10/25 pts" —
 * it only confirms the pick is accepted by the rules. Scoring happens later.
 */
export function validateSubChampionHalf(
  championTeamId: string,
  subChampionTeamId: string,
  teamHalves: Map<string, BracketHalf>
): SubChampionValidationResult {
  if (championTeamId === subChampionTeamId) {
    return { valid: false, reason: "SAME_TEAM" };
  }
  const champHalf = teamHalves.get(championTeamId);
  const subHalf = teamHalves.get(subChampionTeamId);
  if (!champHalf || champHalf === "neutral" || !subHalf || subHalf === "neutral") {
    return { valid: false, reason: "UNRESOLVED_HALF" };
  }
  if (champHalf === subHalf) {
    return { valid: false, reason: "SAME_HALF" };
  }
  return { valid: true };
}
