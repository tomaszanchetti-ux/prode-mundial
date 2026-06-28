import {
  MATCH_SCORING_RULES,
  buildCompactSlotLabel,
  computeStageCompletion,
  type MatchDetail,
  type MatchStatus,
  type MatchSummary,
  type PhaseCompletionMatch,
  type SaveMatchPredictionResponse,
  type StageCompletionMap,
  resolveTeamIdentity,
  type TeamRef,
  type UserMatchPrediction
} from "@prode/shared";
import type {
  DerivedMatchViewState,
  ResolvedMatchTeams,
  StoredMatch,
  StoredPrediction,
  StoredTeam
} from "../types";
import { deriveMatchState, getPredictionDeadlineAt, getPredictionOpensAt } from "./match-state";

/**
 * Optional phase-aware context for derive helpers. Callers that have access
 * to the full tournament match list should compute and pass this so that
 * `isEditable` reflects phase locks (CLOSE gate when a stage is fully
 * finished, plus the existing OPEN gate for knockout matches with
 * unresolved slots).
 */
export type TournamentContext = {
  stageCompletion: StageCompletionMap;
};

export function buildTournamentContext(matches: PhaseCompletionMatch[]): TournamentContext {
  return { stageCompletion: computeStageCompletion(matches) };
}

function isPhaseLockedForMatch(match: StoredMatch, context?: TournamentContext): boolean {
  // (a) Knockout match with unresolved slots → upstream phase not yet hydrated.
  if (match.stage !== "group" && (match.homeTeamId === null || match.awayTeamId === null)) {
    return true;
  }
  // (b) The match's own stage is fully finished → no point editing.
  if (context?.stageCompletion?.[match.stage]) {
    return true;
  }
  return false;
}

const CURSOR_SEPARATOR = "::";

function formatPredictionSummary(prediction: StoredPrediction | null) {
  if (!prediction) {
    return null;
  }

  return `${prediction.homeScorePred}-${prediction.awayScorePred}`;
}

// For knockout matches with unresolved slots we surface the compact slot
// label (1B, 2A, W49, L73, 3ºABCDF) directly as the team name — same vocab
// as the bracket view, no "Por definir" prefix. If there is no slot at all
// we fall back to "Por definir".
function buildSlotTeamRef(slot: string | null | undefined, fallbackKey: string): TeamRef {
  if (slot) {
    return {
      teamId: `slot:${slot}`,
      name: buildCompactSlotLabel(slot),
      ...resolveTeamIdentity(null)
    };
  }

  return {
    teamId: `tbd:${fallbackKey}`,
    name: "Por definir",
    ...resolveTeamIdentity(null)
  };
}

function buildKnownTeamRef(teamId: string, teamsById: Map<string, StoredTeam>): TeamRef {
  const team = teamsById.get(teamId);

  if (!team) {
    return {
      teamId,
      name: teamId,
      ...resolveTeamIdentity(teamId)
    };
  }

  return {
    teamId: team.teamId,
    name: team.name,
    ...resolveTeamIdentity(team.fifaCode, team.flagUrl)
  };
}

export function resolveMatchTeams(match: StoredMatch, teamsById: Map<string, StoredTeam>): ResolvedMatchTeams {
  const homeTeam = match.homeTeamId
    ? buildKnownTeamRef(match.homeTeamId, teamsById)
    : buildSlotTeamRef(match.homeSlot, `${match.matchId}:home`);
  const awayTeam = match.awayTeamId
    ? buildKnownTeamRef(match.awayTeamId, teamsById)
    : buildSlotTeamRef(match.awaySlot, `${match.matchId}:away`);

  return {
    homeTeam,
    awayTeam
  };
}

export function deriveMatchViewState(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  now = new Date(),
  context?: TournamentContext
): DerivedMatchViewState {
  const baseState = deriveMatchState(match, prediction, now);
  const phaseLocked = isPhaseLockedForMatch(match, context);

  // Phase lock override: when the match's stage is closed (or its slots
  // unresolved), force isEditable=false and downgrade saved_editable preds
  // to locked_unscored so the rest of the pipeline (ctaLabel, UI gating)
  // reacts coherently.
  const derivedState = phaseLocked
    ? {
        ...baseState,
        isEditable: false,
        isLocked: true,
        predictionStatus:
          baseState.predictionStatus === "saved_editable"
            ? ("locked_unscored" as const)
            : baseState.predictionStatus
      }
    : baseState;

  const userPredictionSummary = formatPredictionSummary(prediction);
  const userPredictionPoints = prediction?.isScored ? prediction.pointsAwarded : null;

  let ctaLabel: string;
  if (derivedState.predictionStatus === "saved_editable") {
    ctaLabel = "Editar";
  } else if (derivedState.predictionStatus === "scored") {
    ctaLabel = "Ver puntos";
  } else if (derivedState.predictionStatus === "locked_unscored") {
    ctaLabel = derivedState.publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  } else if (derivedState.predictionStatus === "void") {
    ctaLabel = "Ver resultado";
  } else if (!derivedState.isEditable) {
    // empty + non-editable: phase locked or future match unreachable.
    ctaLabel = derivedState.publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  } else {
    ctaLabel = "Predecir";
  }

  return {
    ...derivedState,
    userPredictionSummary,
    userPredictionPoints,
    ctaLabel
  };
}

export function toUserMatchPrediction(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  now = new Date(),
  context?: TournamentContext
): UserMatchPrediction | null {
  if (!prediction) {
    return null;
  }

  const state = deriveMatchViewState(match, prediction, now, context);
  const scoringBreakdown = prediction.isScored && prediction.scoringBreakdown
    ? {
        exact90Hit: prediction.scoringBreakdown.exact90Points > 0,
        correctOutcome90Hit: prediction.scoringBreakdown.outcome90Points > 0,
        penaltyHit: (prediction.scoringBreakdown.penaltyBonusPoints ?? 0) > 0,
        pointsExact90: prediction.scoringBreakdown.exact90Points,
        pointsOutcome90: prediction.scoringBreakdown.outcome90Points,
        pointsPenalty: prediction.scoringBreakdown.penaltyBonusPoints ?? 0,
        pointsTotal: prediction.scoringBreakdown.totalPoints
      }
    : undefined;

  return {
    predictionId: prediction.predictionId,
    homeScorePred: prediction.homeScorePred,
    awayScorePred: prediction.awayScorePred,
    advancesTeamPred: prediction.advancesTeamPred ?? null,
    status: state.predictionStatus,
    pointsAwarded: prediction.isScored ? prediction.pointsAwarded : null,
    submittedAt: prediction.createdAt,
    updatedAt: prediction.updatedAt,
    scoringBreakdown
  };
}

export function toMatchSummary(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  teamsById: Map<string, StoredTeam>,
  now = new Date(),
  context?: TournamentContext
): MatchSummary {
  const state = deriveMatchViewState(match, prediction, now, context);
  const teams = resolveMatchTeams(match, teamsById);

  return {
    matchId: match.matchId,
    stage: match.stage,
    groupId: match.groupId,
    homeTeam: teams.homeTeam,
    awayTeam: teams.awayTeam,
    kickoffAt: match.kickoffAt,
    predictionOpensAt: getPredictionOpensAt(match).toISOString(),
    status: state.publicStatus,
    deadlineAt: getPredictionDeadlineAt(match).toISOString(),
    isLocked: state.isLocked,
    isFinished: state.isFinished,
    isScored: state.isScored,
    predictionStatus: state.predictionStatus,
    userPredictionSummary: state.userPredictionSummary,
    userPredictionPoints: state.userPredictionPoints,
    isEditable: state.isEditable,
    ctaLabel: state.ctaLabel,
    homeScore90: match.homeScore90,
    awayScore90: match.awayScore90,
    officialMatchNumber: match.officialMatchNumber ?? null,
    homeSlot: match.homeSlot ?? null,
    awaySlot: match.awaySlot ?? null,
    winnerTeamId: match.winnerTeamId
  };
}

export function toMatchDetail(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  teamsById: Map<string, StoredTeam>,
  now = new Date(),
  context?: TournamentContext
): MatchDetail {
  const summary = toMatchSummary(match, prediction, teamsById, now, context);
  const officialResult =
    summary.status === "finished" && match.homeScore90 !== null && match.awayScore90 !== null
      ? {
          homeScore90: match.homeScore90,
          awayScore90: match.awayScore90,
          qualifiedTeamId: match.winnerTeamId,
          status: summary.status
        }
      : null;

  return {
    ...summary,
    officialResult,
    userPrediction: toUserMatchPrediction(match, prediction, now, context),
    scoringRules: MATCH_SCORING_RULES
  };
}

export function toSaveMatchPredictionResponse(
  match: StoredMatch,
  prediction: StoredPrediction,
  now = new Date(),
  context?: TournamentContext
): SaveMatchPredictionResponse {
  const state = deriveMatchViewState(match, prediction, now, context);

  return {
    predictionId: prediction.predictionId,
    matchId: prediction.matchId,
    status: state.predictionStatus,
    isEditable: state.isEditable,
    homeScorePred: prediction.homeScorePred,
    awayScorePred: prediction.awayScorePred,
    savedAt: prediction.updatedAt
  };
}

export function encodeMatchesCursor(summary: MatchSummary) {
  return `${summary.kickoffAt}${CURSOR_SEPARATOR}${summary.matchId}`;
}

export function applyMatchesCursor(items: MatchSummary[], cursor?: string) {
  if (!cursor) {
    return items;
  }

  const [cursorKickoffAt, cursorMatchId] = cursor.split(CURSOR_SEPARATOR);

  if (!cursorKickoffAt || !cursorMatchId) {
    return items;
  }

  return items.filter((item) => {
    if (item.kickoffAt > cursorKickoffAt) {
      return true;
    }

    if (item.kickoffAt < cursorKickoffAt) {
      return false;
    }

    return item.matchId > cursorMatchId;
  });
}
