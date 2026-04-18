/**
 * Builds the official World Cup bracket directly from MatchSummary[] data.
 *
 * World Cup screen is a read-only mirror of the SOT: teams show up only when
 * Firestore has hydrated `homeTeamId`/`awayTeamId` from real group/knockout
 * results. Rounds that haven't been hydrated yet (R16+ until EPIC 16 lands,
 * or any round before its upstream closes) show slot labels ("Ganador del M73").
 *
 * No prediction simulation — unlike `/tournament` (Mis Resultados), which
 * uses `simulateKnockoutBracket` to project user predictions forward, this
 * path only reflects official data.
 *
 * Pure function — no I/O.
 */

import {
  buildSlotLabel,
  type MatchStage,
  type MatchStatus,
  type MatchSummary,
  type TeamRef,
  type TournamentProjectionBracket,
  type TournamentProjectionMatch,
  type TournamentProjectionMatchSource,
  type TournamentProjectionReadiness,
  type TournamentProjectionSide
} from "@prode/shared";

const KNOCKOUT_STAGES: MatchStage[] = ["R32", "R16", "QF", "SF", "BRONZE", "FINAL"];

/**
 * `MatchSummary.homeTeam` always carries a TeamRef. When the match hasn't been
 * hydrated yet, the api serializer returns a placeholder with `teamId` like
 * `slot:1A` or `tbd:<matchId>:home` (see `buildSlotTeamRef` in match-payloads).
 * We treat both as "not a real team" for bracket rendering.
 */
function isHydratedTeam(team: TeamRef): boolean {
  if (!team.teamId) return false;
  if (team.teamId.startsWith("slot:")) return false;
  if (team.teamId.startsWith("tbd:")) return false;
  return true;
}

function buildSide(team: TeamRef, slot: string | null): TournamentProjectionSide {
  if (isHydratedTeam(team)) {
    return {
      team,
      slot: slot ?? "",
      slotLabel: slot ? buildSlotLabel(slot) : team.name
    };
  }

  return {
    team: null,
    slot: slot ?? "",
    slotLabel: slot ? buildSlotLabel(slot) : "Por definir"
  };
}

function toProjectionMatch(match: MatchSummary): TournamentProjectionMatch {
  const home = buildSide(match.homeTeam, match.homeSlot);
  const away = buildSide(match.awayTeam, match.awaySlot);

  const bothHydrated = home.team !== null && away.team !== null;
  const source: TournamentProjectionMatchSource = bothHydrated ? "anchored" : "unresolved";

  return {
    matchId: match.matchId,
    officialMatchNumber: match.officialMatchNumber ?? 0,
    stage: match.stage,
    kickoffAt: match.kickoffAt,
    // MatchSummary does not expose kickoffAtEt / venueId today — not needed
    // for bracket visuals. If future consumers want them, they can come from
    // MatchDetail or be added to MatchSummary at that point.
    kickoffAtEt: null,
    venueId: null,
    home,
    away,
    winnerTeamId: match.winnerTeamId,
    source
  };
}

function bucketByStage(matches: MatchSummary[]): Record<MatchStage, MatchSummary[]> {
  const buckets: Record<MatchStage, MatchSummary[]> = {
    group: [],
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    BRONZE: [],
    FINAL: []
  };

  for (const match of matches) {
    const bucket = buckets[match.stage];
    if (bucket) bucket.push(match);
  }

  return buckets;
}

function isOfficiallyFinished(status: MatchStatus): boolean {
  return status === "finished";
}

export type OfficialBracketResult = {
  bracket: TournamentProjectionBracket;
  readiness: TournamentProjectionReadiness;
};

export function buildOfficialBracket(matches: MatchSummary[]): OfficialBracketResult {
  const buckets = bucketByStage(matches);

  const bracket: TournamentProjectionBracket = {
    round32: buckets.R32.map(toProjectionMatch),
    round16: buckets.R16.map(toProjectionMatch),
    quarterfinals: buckets.QF.map(toProjectionMatch),
    semifinals: buckets.SF.map(toProjectionMatch),
    bronze: buckets.BRONZE.map(toProjectionMatch),
    final: buckets.FINAL.map(toProjectionMatch)
  };

  const groupMatches = buckets.group;
  const groupMatchesTotal = groupMatches.length;
  const groupMatchesFinished = groupMatches.filter((m) => isOfficiallyFinished(m.status)).length;

  const readiness: TournamentProjectionReadiness = {
    groupMatchesTotal,
    // In the World Cup (official) context we repurpose the "with prediction"
    // counter to mean "officially finished". Same semantic: how many group
    // slots are resolved. `/tournament` keeps its own meaning intact.
    groupMatchesWithPrediction: groupMatchesFinished,
    isGroupsComplete: groupMatchesTotal > 0 && groupMatchesFinished === groupMatchesTotal,
    unresolvedSlots: []
  };

  return { bracket, readiness };
}

export { KNOCKOUT_STAGES };
