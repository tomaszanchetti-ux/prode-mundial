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
    penaltyBonusPoints: 0,
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
    penaltyBonusPoints: 0,
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
    penaltyBonusPoints: 0,
    totalPoints: 0
  });
});

test("scorePrediction: knockout draw + predicted draw + correct advancer → exact + penalty bonus", () => {
  // QF termina 1-1 al 90', Argentina pasa por penales (winnerTeamId=ARG).
  // User predijo 1-1 y eligió ARG: 5 (exact) + 1 (bonus penales) = 6.
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
      advancesTeamPred: "ARG"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 5,
    outcome90Points: 0,
    penaltyBonusPoints: 1,
    totalPoints: 6
  });
});

test("scorePrediction: knockout draw + non-exact draw + correct advancer → outcome + penalty bonus", () => {
  // QF termina 1-1; user predijo 0-0 (empate, no exacto) y eligió ARG: 2 (outcome) + 1 (bonus) = 3.
  const result = scorePrediction(
    buildMatch({
      stage: "QF",
      groupId: null,
      homeScore90: 1,
      awayScore90: 1,
      winnerTeamId: "ARG"
    }),
    {
      homeScorePred: 0,
      awayScorePred: 0,
      advancesTeamPred: "ARG"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 2,
    penaltyBonusPoints: 1,
    totalPoints: 3
  });
});

test("scorePrediction: knockout draw + predicted draw + WRONG advancer → no bonus", () => {
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
      advancesTeamPred: "BRA"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 5,
    outcome90Points: 0,
    penaltyBonusPoints: 0,
    totalPoints: 5
  });
});

test("scorePrediction: knockout draw + predicted draw + no advancer chosen → no bonus", () => {
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
    penaltyBonusPoints: 0,
    totalPoints: 5
  });
});

test("scorePrediction: group-stage draw never grants penalty bonus", () => {
  // Empate en grupos no va a penales: aunque mande advancesTeamPred, no hay bonus.
  const result = scorePrediction(
    buildMatch({
      stage: "group",
      groupId: "A",
      homeScore90: 1,
      awayScore90: 1,
      winnerTeamId: null
    }),
    {
      homeScorePred: 1,
      awayScorePred: 1,
      advancesTeamPred: "ARG"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 5,
    outcome90Points: 0,
    penaltyBonusPoints: 0,
    totalPoints: 5
  });
});

test("scorePrediction awards outcome on knockout when user predicts draw but match ends 2-0", () => {
  // No fue empate al 90' → no hay penales → sin bonus aunque elija un equipo.
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
      awayScorePred: 1,
      advancesTeamPred: "ARG"
    }
  );

  assert.deepEqual(result, {
    exact90Points: 0,
    outcome90Points: 2,
    penaltyBonusPoints: 0,
    totalPoints: 2
  });
});
