/**
 * Plans the progressive hydration of knock-out rounds (R16 → Final).
 *
 * When a knock-out round finishes (every match has a winnerTeamId), the
 * downstream round can be hydrated: its slot labels ("W73", "L101") are
 * resolved to real teamIds pulled from the prior round's winners/losers.
 *
 * Gating rule — a downstream round is hydrated only when its **entire
 * upstream round** is closed. This matches the agreed UX for EPIC 16:
 * phase-complete triggers propagation + phase unlocks, not match-by-match.
 *
 * The planner is pure — callers apply the returned patches and decide how
 * to surface phaseUnlocks to the UI.
 *
 * Supported slot grammar (shared with bracket-simulator + slot-label):
 *   - "W<officialMatchNumber>" → winnerTeamId of the referenced match
 *   - "L<officialMatchNumber>" → loser (the team that is not the winner)
 *
 * R32 is handled separately by planBracketHydration (group stage → R32).
 */

import type { HydrationMatch, BracketHydrationPatch } from "./bracket-hydration";
import type { KnockoutStage } from "./bracket-simulator";

export type KnockoutPhaseReadiness = {
  r16: boolean;
  qf: boolean;
  sf: boolean;
  bronzeFinal: boolean;
};

export type KnockoutHydrationPlan = {
  patches: BracketHydrationPatch[];
  phaseReady: KnockoutPhaseReadiness;
  unresolvedSlots: string[];
};

const KNOCKOUT_STAGES: KnockoutStage[] = ["R32", "R16", "QF", "SF", "BRONZE", "FINAL"];

function isKnockoutStage(stage: string): stage is KnockoutStage {
  return (KNOCKOUT_STAGES as string[]).includes(stage);
}

function parseOrdinalReferenceSlot(
  slot: string
): { kind: "winner" | "loser"; matchNumber: number } | null {
  const match = /^([WL])(\d+)$/.exec(slot);

  if (!match) {
    return null;
  }

  return {
    kind: match[1] === "W" ? "winner" : "loser",
    matchNumber: Number.parseInt(match[2], 10)
  };
}

function isRoundComplete(matches: HydrationMatch[]): boolean {
  if (matches.length === 0) {
    return false;
  }

  return matches.every((match) => typeof match.winnerTeamId === "string" && match.winnerTeamId !== null);
}

function resolveTeamFromSlot(
  slot: string,
  matchByOfficialNumber: Map<number, HydrationMatch>
): { resolved: string | null; unresolvedSlot: string | null } {
  const reference = parseOrdinalReferenceSlot(slot);

  if (!reference) {
    return { resolved: null, unresolvedSlot: slot };
  }

  const source = matchByOfficialNumber.get(reference.matchNumber);

  if (!source || !source.winnerTeamId) {
    return { resolved: null, unresolvedSlot: slot };
  }

  if (reference.kind === "winner") {
    return { resolved: source.winnerTeamId, unresolvedSlot: null };
  }

  if (source.homeTeamId && source.awayTeamId) {
    const loser =
      source.homeTeamId === source.winnerTeamId ? source.awayTeamId : source.homeTeamId;
    return { resolved: loser, unresolvedSlot: null };
  }

  return { resolved: null, unresolvedSlot: slot };
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

/**
 * Plans hydration patches for every knock-out round downstream of R32.
 * R32 hydration itself is owned by planBracketHydration (group→R32).
 */
export function planKnockoutHydration(matches: HydrationMatch[]): KnockoutHydrationPlan {
  const matchesByStage = new Map<KnockoutStage, HydrationMatch[]>();

  for (const stage of KNOCKOUT_STAGES) {
    matchesByStage.set(stage, []);
  }

  const matchByOfficialNumber = new Map<number, HydrationMatch>();

  for (const match of matches) {
    if (!isKnockoutStage(match.stage)) {
      continue;
    }

    matchesByStage.get(match.stage)!.push(match);

    if (typeof match.officialMatchNumber === "number") {
      matchByOfficialNumber.set(match.officialMatchNumber, match);
    }
  }

  const r32Done = isRoundComplete(matchesByStage.get("R32") ?? []);
  const r16Done = isRoundComplete(matchesByStage.get("R16") ?? []);
  const qfDone = isRoundComplete(matchesByStage.get("QF") ?? []);
  const sfDone = isRoundComplete(matchesByStage.get("SF") ?? []);

  const phaseReady: KnockoutPhaseReadiness = {
    r16: r32Done,
    qf: r16Done,
    sf: qfDone,
    bronzeFinal: sfDone
  };

  const patches: BracketHydrationPatch[] = [];
  const unresolvedSlots: string[] = [];

  // For each destination round, propagate only if its upstream round is closed.
  const propagationPlan: Array<{ destination: KnockoutStage; gate: boolean }> = [
    { destination: "R16", gate: phaseReady.r16 },
    { destination: "QF", gate: phaseReady.qf },
    { destination: "SF", gate: phaseReady.sf },
    { destination: "BRONZE", gate: phaseReady.bronzeFinal },
    { destination: "FINAL", gate: phaseReady.bronzeFinal }
  ];

  for (const { destination, gate } of propagationPlan) {
    if (!gate) {
      continue;
    }

    const destinationMatches = matchesByStage.get(destination) ?? [];

    for (const match of destinationMatches) {
      const homeResolution = match.homeSlot
        ? resolveTeamFromSlot(match.homeSlot, matchByOfficialNumber)
        : { resolved: null, unresolvedSlot: null };
      const awayResolution = match.awaySlot
        ? resolveTeamFromSlot(match.awaySlot, matchByOfficialNumber)
        : { resolved: null, unresolvedSlot: null };

      if (homeResolution.unresolvedSlot) {
        unresolvedSlots.push(homeResolution.unresolvedSlot);
      }

      if (awayResolution.unresolvedSlot) {
        unresolvedSlots.push(awayResolution.unresolvedSlot);
      }

      const patch = buildPatchForCurrentState(match, homeResolution.resolved, awayResolution.resolved);

      if (patch) {
        patches.push(patch);
      }
    }
  }

  return {
    patches,
    phaseReady,
    unresolvedSlots
  };
}
