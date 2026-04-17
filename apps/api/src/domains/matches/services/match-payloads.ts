import {
  MATCH_SCORING_RULES,
  type MatchDetail,
  type MatchStatus,
  type MatchSummary,
  type SaveMatchPredictionResponse,
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

const CURSOR_SEPARATOR = "::";

export function resolvePredictedQualifierTeamId(prediction: StoredPrediction | null) {
  if (!prediction) {
    return null;
  }

  return prediction.predictedQualifierTeamId ?? prediction.predictedWinnerTeamId ?? null;
}

function formatPredictionSummary(prediction: StoredPrediction | null) {
  if (!prediction) {
    return null;
  }

  const qualifier = resolvePredictedQualifierTeamId(prediction);
  const baseSummary = `${prediction.homeScorePred}-${prediction.awayScorePred}`;

  if (prediction.homeScorePred === prediction.awayScorePred && qualifier) {
    return `${baseSummary} (${qualifier})`;
  }

  return baseSummary;
}

function buildSlotTeamRef(slot: string | null | undefined, fallbackKey: string): TeamRef {
  if (slot) {
    return {
      teamId: `slot:${slot}`,
      name: `Por definir (${slot})`,
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

export function deriveMatchViewState(match: StoredMatch, prediction: StoredPrediction | null, now = new Date()): DerivedMatchViewState {
  const derivedState = deriveMatchState(match, prediction, now);
  const requiresQualifierIfDraw = match.stage !== "group";
  const qualifier = resolvePredictedQualifierTeamId(prediction);
  const userPredictionSummary = formatPredictionSummary(prediction);
  let ctaLabel = "Predecir";

  if (derivedState.predictionStatus === "saved_editable") {
    ctaLabel = "Editar prediccion";
  } else if (derivedState.predictionStatus === "scored") {
    ctaLabel = "Ver puntos";
  } else if (derivedState.predictionStatus === "locked_unscored") {
    ctaLabel = derivedState.publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  } else if (derivedState.predictionStatus === "void") {
    ctaLabel = "Ver resultado";
  } else if (!derivedState.isEditable) {
    ctaLabel = derivedState.publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  }

  if (
    requiresQualifierIfDraw &&
    prediction &&
    prediction.homeScorePred === prediction.awayScorePred &&
    !qualifier &&
    derivedState.isEditable
  ) {
    ctaLabel = "Editar prediccion";
  }

  return {
    ...derivedState,
    requiresQualifierIfDraw,
    userPredictionSummary,
    ctaLabel
  };
}

export function toUserMatchPrediction(match: StoredMatch, prediction: StoredPrediction | null, now = new Date()): UserMatchPrediction | null {
  if (!prediction) {
    return null;
  }

  const state = deriveMatchViewState(match, prediction, now);
  const qualifier = resolvePredictedQualifierTeamId(prediction);
  const scoringBreakdown = prediction.isScored && prediction.scoringBreakdown
    ? {
        exact90Hit: prediction.scoringBreakdown.exact90Points > 0,
        correctOutcome90Hit: prediction.scoringBreakdown.outcome90Points > 0,
        correctQualifierHit: prediction.scoringBreakdown.qualifierPoints > 0,
        pointsExact90: prediction.scoringBreakdown.exact90Points,
        pointsOutcome90: prediction.scoringBreakdown.outcome90Points,
        pointsQualifier: prediction.scoringBreakdown.qualifierPoints,
        pointsTotal: prediction.scoringBreakdown.totalPoints
      }
    : undefined;

  return {
    predictionId: prediction.predictionId,
    homeScorePred: prediction.homeScorePred,
    awayScorePred: prediction.awayScorePred,
    predictedQualifierTeamId: qualifier,
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
  now = new Date()
): MatchSummary {
  const state = deriveMatchViewState(match, prediction, now);
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
    isEditable: state.isEditable,
    ctaLabel: state.ctaLabel,
    homeScore90: match.homeScore90,
    awayScore90: match.awayScore90
  };
}

export function toMatchDetail(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  teamsById: Map<string, StoredTeam>,
  now = new Date()
): MatchDetail {
  const summary = toMatchSummary(match, prediction, teamsById, now);
  const state = deriveMatchViewState(match, prediction, now);
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
    requiresQualifierIfDraw: state.requiresQualifierIfDraw,
    officialResult,
    userPrediction: toUserMatchPrediction(match, prediction, now),
    scoringRules: MATCH_SCORING_RULES
  };
}

export function toSaveMatchPredictionResponse(
  match: StoredMatch,
  prediction: StoredPrediction,
  now = new Date()
): SaveMatchPredictionResponse {
  const state = deriveMatchViewState(match, prediction, now);

  return {
    predictionId: prediction.predictionId,
    matchId: prediction.matchId,
    status: state.predictionStatus,
    isEditable: state.isEditable,
    homeScorePred: prediction.homeScorePred,
    awayScorePred: prediction.awayScorePred,
    predictedQualifierTeamId: resolvePredictedQualifierTeamId(prediction),
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
