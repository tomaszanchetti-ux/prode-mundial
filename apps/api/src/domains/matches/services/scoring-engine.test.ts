import assert from "node:assert/strict";
import test from "node:test";
import type { StoredMatch } from "../types";
import { scorePrediction } from "./scoring-engine";

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
    kickoffAtEt: null,
    status: "finished",
    homeScore90: 2,
    awayScore90: 1,
    winnerTeamId: "ARG",
    isLocked: true,
    isScored: false,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

test("scorePrediction awards exact and outcome points on exact group hits", () => {
  const result = scorePrediction(buildMatch(), {
    homeScorePred: 2,
    awayScorePred: 1
  });

  assert.deepEqual(result, {
    exact90Points: 4,
    outcome90Points: 2,
    qualifierPoints: 0,
    totalPoints: 6
  });
});

test("scorePrediction awards qualifier points on knockout draw qualifier hit", () => {
  const result = scorePrediction(
    buildMatch({
      stage: "QF",
      groupId: null,
      homeScore90: 1,
      awayScore90: 1,
      winnerTeamId: "ARG"
    }),
    {
      homeScorePred: 1,
      awayScorePred: 1,
      predictedQualifierTeamId: "ARG"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 4,
    outcome90Points: 2,
    qualifierPoints: 2,
    totalPoints: 8
  });
});

test("scorePrediction returns zero when outcome is missed", () => {
  const result = scorePrediction(buildMatch(), {
    homeScorePred: 0,
    awayScorePred: 2
  });

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 0,
    qualifierPoints: 0,
    totalPoints: 0
  });
});

