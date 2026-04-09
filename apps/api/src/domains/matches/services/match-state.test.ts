import assert from "node:assert/strict";
import test from "node:test";
import type { StoredMatch, StoredPrediction } from "../types";
import { deriveMatchFunctionalState, deriveMatchState, derivePredictionLifecycleState, derivePredictionStatus } from "./match-state";

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
    homeScorePred: 2,
    awayScorePred: 1,
    predictedWinnerTeamId: null,
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

test("deriveMatchFunctionalState returns EDITABLE before kickoff for scheduled unlocked match", () => {
  assert.equal(deriveMatchFunctionalState(buildMatch(), new Date("2026-06-11T15:00:00Z")), "EDITABLE");
});

test("deriveMatchFunctionalState returns SCHEDULED_WAITING_WINDOW before prediction window opens", () => {
  assert.equal(deriveMatchFunctionalState(buildMatch(), new Date("2026-06-11T12:30:00Z")), "SCHEDULED_WAITING_WINDOW");
});

test("deriveMatchFunctionalState returns LOCKED_PENDING once scheduled match reaches kickoff", () => {
  assert.equal(deriveMatchFunctionalState(buildMatch(), new Date("2026-06-11T19:00:00Z")), "LOCKED_PENDING");
});

test("deriveMatchFunctionalState returns LIVE_LOCKED for live matches", () => {
  assert.equal(
    deriveMatchFunctionalState(buildMatch({ status: "live", isLocked: true }), new Date("2026-06-11T20:00:00Z")),
    "LIVE_LOCKED"
  );
});

test("deriveMatchFunctionalState returns FINISHED_PENDING_SCORING for finished unscored matches", () => {
  assert.equal(
    deriveMatchFunctionalState(buildMatch({ status: "finished", isLocked: true }), new Date("2026-06-11T22:00:00Z")),
    "FINISHED_PENDING_SCORING"
  );
});

test("deriveMatchFunctionalState returns SCORED for finished scored matches", () => {
  assert.equal(
    deriveMatchFunctionalState(
      buildMatch({ status: "finished", isLocked: true, isScored: true }),
      new Date("2026-06-11T22:00:00Z")
    ),
    "SCORED"
  );
});

test("derivePredictionLifecycleState returns draft for editable saved prediction", () => {
  assert.equal(
    derivePredictionLifecycleState(buildMatch(), buildPrediction(), new Date("2026-06-11T15:00:00Z")),
    "draft"
  );
});

test("derivePredictionLifecycleState returns locked after kickoff", () => {
  assert.equal(
    derivePredictionLifecycleState(buildMatch(), buildPrediction(), new Date("2026-06-11T19:00:00Z")),
    "locked"
  );
});

test("derivePredictionLifecycleState returns scored for scored prediction", () => {
  assert.equal(
    derivePredictionLifecycleState(
      buildMatch({ status: "finished", isLocked: true, isScored: true }),
      buildPrediction({ isScored: true, pointsAwarded: 6 }),
      new Date("2026-06-11T22:00:00Z")
    ),
    "scored"
  );
});

test("derivePredictionStatus returns void for live match without prediction", () => {
  assert.equal(
    derivePredictionStatus(buildMatch({ status: "live", isLocked: true }), null, new Date("2026-06-11T20:00:00Z")),
    "void"
  );
});

test("deriveMatchState exposes explicit backend flags consistently", () => {
  const state = deriveMatchState(
    buildMatch({ status: "finished", isLocked: true, isScored: true }),
    buildPrediction({ isScored: true, pointsAwarded: 4 }),
    new Date("2026-06-11T22:00:00Z")
  );

  assert.equal(state.matchState, "SCORED");
  assert.equal(state.predictionLifecycleState, "scored");
  assert.equal(state.predictionStatus, "scored");
  assert.equal(state.isEditable, false);
  assert.equal(state.isLocked, true);
  assert.equal(state.isFinished, true);
  assert.equal(state.isScored, true);
});
