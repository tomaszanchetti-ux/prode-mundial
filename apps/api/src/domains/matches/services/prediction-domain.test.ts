import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../../server/errors/api-error";
import type { StoredMatch, StoredPrediction } from "../types";
import {
  assertMatchPredictionEditable,
  assertPredictionOwnership,
  validatePredictionInput
} from "./prediction-domain";
import { buildTournamentContext } from "./match-payloads";

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
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

test("validatePredictionInput accepts group predictions", () => {
  const result = validatePredictionInput(
    buildMatch(),
    {
      homeScorePred: 2,
      awayScorePred: 1
    },
    new Date("2026-06-11T15:00:00Z")
  );

  assert.deepEqual(result, {
    homeScorePred: 2,
    awayScorePred: 1
  });
});

test("validatePredictionInput accepts knockout draws without needing qualifier", () => {
  // EPIC 24: en knockouts solo cuenta el 90'. El empate es válido sin qualifier.
  const result = validatePredictionInput(
    buildMatch({ stage: "R32", groupId: null }),
    {
      homeScorePred: 1,
      awayScorePred: 1
    },
    new Date("2026-06-11T15:00:00Z")
  );

  assert.deepEqual(result, {
    homeScorePred: 1,
    awayScorePred: 1
  });
});

test("validatePredictionInput accepts knockout non-draw predictions", () => {
  const result = validatePredictionInput(
    buildMatch({ stage: "R32", groupId: null }),
    {
      homeScorePred: 3,
      awayScorePred: 1
    },
    new Date("2026-06-11T15:00:00Z")
  );

  assert.deepEqual(result, {
    homeScorePred: 3,
    awayScorePred: 1
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

test("assertMatchPredictionEditable allows matches many hours before kickoff (predictions always open)", () => {
  assert.doesNotThrow(() => assertMatchPredictionEditable(buildMatch(), new Date("2026-04-15T10:00:00Z")));
});

test("assertMatchPredictionEditable rejects matches within 1 hour of kickoff", () => {
  assert.throws(
    () => assertMatchPredictionEditable(buildMatch(), new Date("2026-06-11T18:30:00Z")),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_LOCKED"
  );
});

test("assertMatchPredictionEditable rejects matches exactly at the prediction deadline", () => {
  assert.throws(
    () => assertMatchPredictionEditable(buildMatch(), new Date("2026-06-11T18:00:00Z")),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_LOCKED"
  );
});

test("assertMatchPredictionEditable rejects knock-out match with unresolved teams (PHASE_LOCKED)", () => {
  const unresolvedR16 = buildMatch({
    matchId: "m_089",
    stage: "R16",
    groupId: null,
    homeTeamId: null,
    awayTeamId: null,
    homeSlot: "W73",
    awaySlot: "W74",
    kickoffAt: "2026-07-03T21:00:00Z"
  });

  assert.throws(
    () => assertMatchPredictionEditable(unresolvedR16, new Date("2026-06-20T10:00:00Z")),
    (error: unknown) => error instanceof ApiError && error.code === "PHASE_LOCKED"
  );
});

test("assertMatchPredictionEditable allows knock-out match once both teams are hydrated", () => {
  const hydratedR16 = buildMatch({
    matchId: "m_089",
    stage: "R16",
    groupId: null,
    homeTeamId: "ARG",
    awayTeamId: "FRA",
    homeSlot: "W73",
    awaySlot: "W74",
    kickoffAt: "2026-07-03T21:00:00Z"
  });

  assert.doesNotThrow(() =>
    assertMatchPredictionEditable(hydratedR16, new Date("2026-06-20T10:00:00Z"))
  );
});

test("assertMatchPredictionEditable never applies PHASE_LOCKED to group-stage matches", () => {
  // Group-stage predictions are always unlocked before their own kickoff —
  // the PHASE_LOCKED guard must be stage-aware and skip groups even when
  // teamIds are null (pathological but defensive).
  const groupMatch = buildMatch({
    stage: "group",
    homeTeamId: null,
    awayTeamId: null
  });

  assert.doesNotThrow(() =>
    assertMatchPredictionEditable(groupMatch, new Date("2026-04-01T00:00:00Z"))
  );
});

test("assertMatchPredictionEditable rejects predictions when the match's stage is fully closed (PHASE_CLOSED)", () => {
  // Group match still scheduled with a far kickoff, but every group match in
  // the context is finished → CLOSE gate kicks in.
  const lateGroupMatch = buildMatch({ matchId: "m_001", stage: "group", kickoffAt: "2026-06-30T19:00:00Z" });
  const context = buildTournamentContext([
    { stage: "group", status: "finished" },
    { stage: "group", status: "finished" }
  ]);

  assert.throws(
    () => assertMatchPredictionEditable(lateGroupMatch, new Date("2026-04-15T00:00:00Z"), context),
    (error: unknown) => error instanceof ApiError && error.code === "PHASE_CLOSED"
  );
});

test("assertMatchPredictionEditable allows predictions when the stage still has scheduled matches", () => {
  const groupMatch = buildMatch({ matchId: "m_001", stage: "group" });
  const context = buildTournamentContext([
    { stage: "group", status: "finished" },
    { stage: "group", status: "scheduled" }
  ]);

  assert.doesNotThrow(() =>
    assertMatchPredictionEditable(groupMatch, new Date("2026-04-15T00:00:00Z"), context)
  );
});

test("assertPredictionOwnership rejects prediction from another user", () => {
  assert.throws(
    () => assertPredictionOwnership(buildPrediction({ userId: "usr_2" }), "usr_1"),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "MATCH_NOT_EDITABLE"
  );
});
