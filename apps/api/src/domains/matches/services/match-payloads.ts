import { MATCH_SCORING_RULES, type MatchDetail, type MatchStatus, type MatchSummary, type TeamRef, type UserMatchPrediction } from "@prode/shared";
import type {
  DerivedMatchViewState,
  ResolvedMatchTeams,
  StoredMatch,
  StoredPrediction,
  StoredTeam
} from "../types";

const CURSOR_SEPARATOR = "::";

function normalizeMatchStatus(status: StoredMatch["status"]): MatchStatus {
  return status === "corrected" ? "finished" : status;
}

function toDateValue(timestamp: string) {
  return new Date(timestamp).getTime();
}

function resolvePredictedQualifierTeamId(prediction: StoredPrediction | null) {
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
      flagUrl: null
    };
  }

  return {
    teamId: `tbd:${fallbackKey}`,
    name: "Por definir",
    flagUrl: null
  };
}

function buildKnownTeamRef(teamId: string, teamsById: Map<string, StoredTeam>): TeamRef {
  const team = teamsById.get(teamId);

  if (!team) {
    return {
      teamId,
      name: teamId,
      flagUrl: null
    };
  }

  return {
    teamId: team.teamId,
    name: team.name,
    flagUrl: team.flagUrl
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
  const publicStatus = normalizeMatchStatus(match.status);
  const isLocked = match.isLocked || publicStatus !== "scheduled" || toDateValue(match.kickoffAt) <= now.getTime();
  const isEditable = !isLocked && publicStatus === "scheduled";
  const requiresQualifierIfDraw = match.stage !== "group";
  const qualifier = resolvePredictedQualifierTeamId(prediction);
  const userPredictionSummary = formatPredictionSummary(prediction);

  let predictionStatus: DerivedMatchViewState["predictionStatus"] = "empty";

  if (prediction) {
    if (prediction.isScored || (match.isScored && prediction.pointsAwarded >= 0)) {
      predictionStatus = "scored";
    } else if (isEditable) {
      predictionStatus = "saved_editable";
    } else {
      predictionStatus = "locked_unscored";
    }
  }

  if (publicStatus !== "scheduled" && !prediction && publicStatus !== "finished") {
    predictionStatus = "void";
  }

  let ctaLabel = "Predecir";

  if (predictionStatus === "saved_editable") {
    ctaLabel = "Editar prediccion";
  } else if (predictionStatus === "scored") {
    ctaLabel = "Ver puntos";
  } else if (predictionStatus === "locked_unscored") {
    ctaLabel = publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  } else if (predictionStatus === "void") {
    ctaLabel = "Ver resultado";
  } else if (!isEditable) {
    ctaLabel = publicStatus === "finished" ? "Ver resultado" : "Bloqueado";
  }

  if (requiresQualifierIfDraw && prediction && prediction.homeScorePred === prediction.awayScorePred && !qualifier && isEditable) {
    ctaLabel = "Editar prediccion";
  }

  return {
    publicStatus,
    isLocked,
    isEditable,
    requiresQualifierIfDraw,
    predictionStatus,
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
    status: state.publicStatus,
    deadlineAt: match.kickoffAt,
    isLocked: state.isLocked,
    predictionStatus: state.predictionStatus,
    userPredictionSummary: state.userPredictionSummary,
    isEditable: state.isEditable,
    ctaLabel: state.ctaLabel
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
