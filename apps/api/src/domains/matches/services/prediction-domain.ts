import { ApiError } from "../../../server/errors/api-error";
import type { StoredMatch, StoredPrediction } from "../types";
import { getPredictionDeadlineAt } from "./match-state";

export type ValidatedPredictionInput = {
  homeScorePred: number;
  awayScorePred: number;
  predictedQualifierTeamId: string | null;
};

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value);
}

function resolveEditableDeadline(match: StoredMatch) {
  return getPredictionDeadlineAt(match).getTime();
}

function isKnockoutMatch(match: StoredMatch) {
  return match.stage !== "group";
}

function sanitizeOptionalQualifier(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "INVALID_KNOCKOUT_CLASSIFIER", "Predicted qualifier must be a valid team id.");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ApiError(400, "INVALID_KNOCKOUT_CLASSIFIER", "Predicted qualifier must be a valid team id.");
  }

  return trimmed;
}

function assertValidScore(value: unknown, fieldName: "homeScorePred" | "awayScorePred") {
  if (!isFiniteInteger(value) || value < 0) {
    throw new ApiError(400, "INVALID_SCORE", `${fieldName} must be an integer greater than or equal to zero.`, {
      field: fieldName
    });
  }

  return value;
}

function assertValidQualifierForMatch(match: StoredMatch, predictedQualifierTeamId: string | null) {
  if (!predictedQualifierTeamId) {
    return;
  }

  const participants = [match.homeTeamId, match.awayTeamId].filter((teamId): teamId is string => Boolean(teamId));

  if (!participants.includes(predictedQualifierTeamId)) {
    throw new ApiError(
      400,
      "INVALID_KNOCKOUT_CLASSIFIER",
      "Predicted qualifier must belong to the selected match.",
      {
        predictedQualifierTeamId,
        participants
      }
    );
  }
}

export function assertMatchPredictionEditable(match: StoredMatch, now = new Date()) {
  if (match.isLocked || match.status !== "scheduled" || resolveEditableDeadline(match) <= now.getTime()) {
    throw new ApiError(409, "MATCH_LOCKED", "This match is locked and cannot be edited anymore.", {
      matchId: match.matchId,
      kickoffAt: match.kickoffAt,
      predictionDeadlineAt: getPredictionDeadlineAt(match).toISOString()
    });
  }

  // Progressive phase unlock: a knock-out match is predictable only once its
  // upstream round has closed officially (at which point bracket-hydration
  // backfills homeTeamId / awayTeamId from the prior round's winners). If the
  // teams are still unresolved, the phase is gated regardless of kickoff.
  const isKnockoutStage = match.stage !== "group";
  const hasBothTeams = match.homeTeamId !== null && match.awayTeamId !== null;

  if (isKnockoutStage && !hasBothTeams) {
    throw new ApiError(
      409,
      "PHASE_LOCKED",
      "This phase has not unlocked yet — the upstream round must close first.",
      {
        matchId: match.matchId,
        stage: match.stage,
        homeSlot: match.homeSlot ?? null,
        awaySlot: match.awaySlot ?? null
      }
    );
  }
}

export function assertPredictionOwnership(prediction: StoredPrediction, userId: string) {
  if (prediction.userId !== userId) {
    throw new ApiError(403, "MATCH_NOT_EDITABLE", "This prediction does not belong to the authenticated user.", {
      predictionId: prediction.predictionId,
      userId
    });
  }
}

export function validatePredictionInput(match: StoredMatch, input: unknown, now = new Date()): ValidatedPredictionInput {
  assertMatchPredictionEditable(match, now);

  if (typeof input !== "object" || input === null) {
    throw new ApiError(400, "INVALID_SCORE", "Prediction input must be an object.");
  }

  const record = input as Record<string, unknown>;
  const homeScorePred = assertValidScore(record.homeScorePred, "homeScorePred");
  const awayScorePred = assertValidScore(record.awayScorePred, "awayScorePred");
  const predictedQualifierTeamId = sanitizeOptionalQualifier(record.predictedQualifierTeamId);

  if (!isKnockoutMatch(match)) {
    return {
      homeScorePred,
      awayScorePred,
      predictedQualifierTeamId: null
    };
  }

  if (homeScorePred === awayScorePred) {
    if (!predictedQualifierTeamId) {
      throw new ApiError(
        400,
        "INVALID_KNOCKOUT_CLASSIFIER",
        "Predicted qualifier is required when a knockout prediction ends in a draw."
      );
    }

    assertValidQualifierForMatch(match, predictedQualifierTeamId);

    return {
      homeScorePred,
      awayScorePred,
      predictedQualifierTeamId
    };
  }

  return {
    homeScorePred,
    awayScorePred,
    predictedQualifierTeamId: null
  };
}
