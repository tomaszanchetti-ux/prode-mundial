import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../../server/errors/api-error";
import type { StoredMatch, StoredPrediction } from "../types";
import {
  assertMatchPredictionEditable,
  assertPredictionOwnership,
  validatePredictionInput
} from "./prediction-domain";

function buildMatch(overrides: Partial<StoredMatch> = {}): StoredMatch {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeamId: "ARG",
    awayTeamId: "BRA",
    homeSlot: null,
    awaySlot: null,
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "scheduled",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: false,
    isScored: false,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

function buildPrediction(overrides: Partial<StoredPrediction> = {}): StoredPrediction {
  return {
    predictionId: "pred_1",
    userId: "usr_1",
    matchId: "m_001",
    homeScorePred: 1,
    awayScorePred: 0,
    predictedQualifierTeamId: null,
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

test("validatePredictionInput sanitizes group predictions and drops redundant qualifier", () => {
  const result = validatePredictionInput(
    buildMatch(),
    {
      homeScorePred: 2,
      awayScorePred: 1,
      predictedQualifierTeamId: "ARG"
    },
    new Date("2026-06-11T15:00:00Z")
  );

  assert.deepEqual(result, {
    homeScorePred: 2,
    awayScorePred: 1,
    predictedQualifierTeamId: null
  });
});

test("validatePredictionInput requires qualifier on knockout draws", () => {
  assert.throws(
    () =>
      validatePredictionInput(
        buildMatch({ stage: "R32", groupId: null }),
        {
          homeScorePred: 1,
          awayScorePred: 1
        },
        new Date("2026-06-11T15:00:00Z")
      ),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_KNOCKOUT_CLASSIFIER"
  );
});

test("validatePredictionInput rejects qualifier that does not belong to the match", () => {
  assert.throws(
    () =>
      validatePredictionInput(
        buildMatch({ stage: "R32", groupId: null }),
        {
          homeScorePred: 1,
          awayScorePred: 1,
          predictedQualifierTeamId: "MEX"
        },
        new Date("2026-06-11T15:00:00Z")
      ),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_KNOCKOUT_CLASSIFIER"
  );
});

test("validatePredictionInput clears qualifier on knockout non-draw predictions", () => {
  const result = validatePredictionInput(
    buildMatch({ stage: "R32", groupId: null }),
    {
      homeScorePred: 3,
      awayScorePred: 1,
      predictedQualifierTeamId: "ARG"
    },
    new Date("2026-06-11T15:00:00Z")
  );

  assert.deepEqual(result, {
    homeScorePred: 3,
    awayScorePred: 1,
    predictedQualifierTeamId: null
  });
});

test("validatePredictionInput rejects invalid score payloads with INVALID_SCORE", () => {
  assert.throws(
    () =>
      validatePredictionInput(
        buildMatch(),
        {
          homeScorePred: 1.5,
          awayScorePred: 0
        },
        new Date("2026-06-11T15:00:00Z")
      ),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_SCORE"
  );
});

test("assertMatchPredictionEditable rejects locked matches", () => {
  assert.throws(
    () => assertMatchPredictionEditable(buildMatch({ isLocked: true }), new Date("2026-06-11T15:00:00Z")),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_LOCKED"
  );
});

test("assertMatchPredictionEditable rejects matches before the 5 hour prediction window opens", () => {
  assert.throws(
    () => assertMatchPredictionEditable(buildMatch(), new Date("2026-06-11T12:30:00Z")),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_LOCKED"
  );
});

test("assertMatchPredictionEditable allows local lab bypass before the prediction window opens", () => {
  const previousValue = process.env.PRODE_ENABLE_LAB_PREDICTIONS;
  process.env.PRODE_ENABLE_LAB_PREDICTIONS = "true";

  try {
    assert.doesNotThrow(() => assertMatchPredictionEditable(buildMatch(), new Date("2026-06-11T12:30:00Z")));
  } finally {
    if (previousValue === undefined) {
      delete process.env.PRODE_ENABLE_LAB_PREDICTIONS;
    } else {
      process.env.PRODE_ENABLE_LAB_PREDICTIONS = previousValue;
    }
  }
});

test("assertPredictionOwnership rejects prediction from another user", () => {
  assert.throws(
    () => assertPredictionOwnership(buildPrediction({ userId: "usr_2" }), "usr_1"),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_NOT_EDITABLE"
  );
});
