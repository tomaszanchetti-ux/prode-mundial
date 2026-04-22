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

test("scorePrediction awards exact points on exact marker hit", () => {
  const result = scorePrediction(buildMatch(), {
    homeScorePred: 2,
    awayScorePred: 1
  });

  assert.deepEqual(result, {
    exact90Points: 5,
    outcome90Points: 0,
    totalPoints: 5
  });
});

test("scorePrediction awards outcome points when marker misses but outcome hits", () => {
  const result = scorePrediction(buildMatch(), {
    homeScorePred: 3,
    awayScorePred: 2
  });

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 2,
    totalPoints: 2
  });
});

test("scorePrediction awards zero when outcome is missed", () => {
  const result = scorePrediction(buildMatch(), {
    homeScorePred: 0,
    awayScorePred: 2
  });

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 0,
    totalPoints: 0
  });
});

test("scorePrediction treats knockout draw like any match — only 90' counts", () => {
  // Partido QF termina 1-1 al 90', Argentina pasa por penales (winnerTeamId=ARG).
  // El user predijo empate 1-1: gana los 5 pts de exact aunque no elija quién clasifica.
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
      awayScorePred: 1
    }
  );

  assert.deepEqual(result, {
    exact90Points: 5,
    outcome90Points: 0,
    totalPoints: 5
  });
});

test("scorePrediction awards outcome on knockout when user predicts draw but match ends 2-0", () => {
  const result = scorePrediction(
    buildMatch({
      stage: "FINAL",
      groupId: null,
      homeScore90: 2,
      awayScore90: 0,
      winnerTeamId: "ARG"
    }),
    {
      homeScorePred: 3,
      awayScorePred: 1
    }
  );

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 2,
    totalPoints: 2
  });
});
