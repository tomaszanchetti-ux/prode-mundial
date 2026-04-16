import assert from "node:assert/strict";
import test from "node:test";
import type { JobStoredMatch, JobStoredPrediction } from "../types";
import { buildMatchLockPlan, shouldLockMatch, summarizeLockPlans } from "./match-lock-enforcement";

function buildMatch(overrides: Partial<JobStoredMatch> = {}): JobStoredMatch {
  return {
    matchId: "m_001",
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "scheduled",
    isLocked: false,
    ...overrides
  };
}

function buildPrediction(overrides: Partial<JobStoredPrediction> = {}): JobStoredPrediction {
  return {
    predictionId: "pred_1",
    matchId: "m_001",
    isLocked: false,
    lockedAt: null,
    ...overrides
  };
}

test("shouldLockMatch returns true when within 1 hour of kickoff", () => {
  assert.equal(shouldLockMatch(buildMatch(), new Date("2026-06-11T18:00:00Z")), true);
});

test("shouldLockMatch returns true when scheduled match reaches kickoff", () => {
  assert.equal(shouldLockMatch(buildMatch(), new Date("2026-06-11T19:00:00Z")), true);
});

test("shouldLockMatch returns false more than 1 hour before kickoff", () => {
  assert.equal(shouldLockMatch(buildMatch(), new Date("2026-06-11T17:30:00Z")), false);
});

test("shouldLockMatch returns false for already locked matches", () => {
  assert.equal(shouldLockMatch(buildMatch({ isLocked: true }), new Date("2026-06-11T20:00:00Z")), false);
});

test("buildMatchLockPlan marks match and only unlocked predictions", () => {
  const plan = buildMatchLockPlan(
    buildMatch(),
    [buildPrediction({ predictionId: "pred_1" }), buildPrediction({ predictionId: "pred_2", isLocked: true })],
    "2026-06-11T19:00:00Z"
  );

  assert.deepEqual(plan.matchPatch, { isLocked: true });
  assert.deepEqual(plan.matchIds, ["m_001"]);
  assert.deepEqual(plan.predictions, [
    {
      predictionId: "pred_1",
      patch: {
        isLocked: true,
        lockedAt: "2026-06-11T19:00:00Z"
      }
    }
  ]);
});

test("summarizeLockPlans aggregates affected matches and predictions", () => {
  const summary = summarizeLockPlans(3, [
    buildMatchLockPlan(buildMatch({ matchId: "m_001" }), [buildPrediction()], "2026-06-11T19:00:00Z"),
    buildMatchLockPlan(buildMatch({ matchId: "m_002" }), [], "2026-06-11T19:00:00Z")
  ]);

  assert.deepEqual(summary, {
    scannedMatches: 3,
    lockedMatches: 2,
    lockedPredictions: 1
  });
});
