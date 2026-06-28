import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPredictionId,
  createStoredPrediction,
  mergeStoredPrediction
} from "./prediction-persistence";

test("buildPredictionId creates a stable id from user and match", () => {
  assert.equal(buildPredictionId("usr_1", "m_001"), "pred_usr_1_m_001");
  assert.equal(buildPredictionId("user/with/slash", "m/001"), "pred_user_with_slash_m_001");
});

test("createStoredPrediction initializes canonical base fields", () => {
  const prediction = createStoredPrediction(
    {
      userId: "usr_1",
      matchId: "m_001",
      homeScorePred: 2,
      awayScorePred: 1
    },
    "2026-04-09T00:00:00Z"
  );

  assert.deepEqual(prediction, {
    predictionId: "pred_usr_1_m_001",
    userId: "usr_1",
    matchId: "m_001",
    homeScorePred: 2,
    awayScorePred: 1,
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    lockedAt: null,
    scoredAt: null
  });
});

test("mergeStoredPrediction overwrites editable fields and preserves scoring history", () => {
  const updated = mergeStoredPrediction(
    {
      predictionId: "pred_usr_1_m_001",
      userId: "usr_1",
      matchId: "m_001",
      homeScorePred: 1,
      awayScorePred: 1,
      isLocked: false,
      isScored: true,
      pointsAwarded: 5,
      scoringBreakdown: {
        exact90Points: 5,
        outcome90Points: 0,
        penaltyBonusPoints: 0,
        totalPoints: 5
      },
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-02T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      scoredAt: "2026-06-12T00:00:00Z"
    },
    {
      homeScorePred: 3,
      awayScorePred: 2
    },
    "2026-04-09T00:00:00Z"
  );

  assert.equal(updated.homeScorePred, 3);
  assert.equal(updated.awayScorePred, 2);
  assert.equal(updated.createdAt, "2026-04-01T00:00:00Z");
  assert.equal(updated.updatedAt, "2026-04-09T00:00:00Z");
  assert.equal(updated.pointsAwarded, 5);
  assert.equal(updated.isScored, true);
});
