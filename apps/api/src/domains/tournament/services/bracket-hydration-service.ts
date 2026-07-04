import {
  planFullHydration,
  type GroupDefinition,
  type HydrationMatch,
  type TournamentPhaseUnlocks
} from "@prode/shared";
import { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_TEAMS } from "../../matches/data/world-cup-2026";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import type { StoredMatch } from "../../matches/types";

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

const TEAM_NAMES_BY_ID = new Map<string, string>(
  WORLD_CUP_2026_TEAMS.map((team) => [team.teamId, team.name])
);

const HYDRATION_GROUP_DEFINITIONS: GroupDefinition[] = WORLD_CUP_2026_GROUPS.map((group) => ({
  groupId: group.groupId,
  teams: group.teamIds.map((teamId) => ({
    teamId,
    teamName: TEAM_NAMES_BY_ID.get(teamId) ?? teamId
  }))
}));

function toHydrationMatch(match: StoredMatch): HydrationMatch {
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

/**
 * Resolves knockout team slots from finalized group / upstream results and
 * persists the patches to Firestore. Idempotent — safe to call after every
 * result ingestion path (match sync, admin manual, recovery job).
 */
export async function runBracketHydration(
  nowIso = new Date().toISOString(),
  groups: GroupDefinition[] = HYDRATION_GROUP_DEFINITIONS
): Promise<BracketHydrationSummary> {
  const internalMatches = await matchesRepository.listMatches();
  const hydrationMatches = internalMatches.map(toHydrationMatch);
  const plan = planFullHydration(hydrationMatches, groups);
  const appliedMatchIds: string[] = [];

  for (const patch of plan.allPatches) {
    const existing = internalMatches.find((match) => match.matchId === patch.matchId);

    if (!existing) {
      continue;
    }

    await matchesRepository.upsertMatch({
      ...existing,
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
