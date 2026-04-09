import assert from "node:assert/strict";
import test from "node:test";
import type { StoredMatch, StoredPrediction } from "../types";
import { applyMatchesCursor, deriveMatchViewState, toMatchSummary } from "./match-payloads";

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
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

test("deriveMatchViewState marks editable saved predictions correctly", () => {
  const state = deriveMatchViewState(
    buildMatch(),
    buildPrediction(),
    new Date("2026-06-10T00:00:00Z")
  );

  assert.equal(state.isEditable, true);
  assert.equal(state.predictionStatus, "saved_editable");
  assert.equal(state.ctaLabel, "Editar prediccion");
});

test("toMatchSummary resolves knockout placeholders from bracket slots", () => {
  const summary = toMatchSummary(
    buildMatch({
      matchId: "m_073",
      stage: "R32",
      groupId: null,
      homeTeamId: null,
      awayTeamId: null,
      homeSlot: "2A",
      awaySlot: "2B"
    }),
    null,
    new Map(),
    new Date("2026-06-20T00:00:00Z")
  );

  assert.equal(summary.homeTeam.teamId, "slot:2A");
  assert.equal(summary.homeTeam.name, "Por definir (2A)");
  assert.equal(summary.awayTeam.teamId, "slot:2B");
});

test("applyMatchesCursor skips rows up to the provided cursor", () => {
  const items = [
    toMatchSummary(buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }), null, new Map()),
    toMatchSummary(buildMatch({ matchId: "m_002", kickoffAt: "2026-06-11T19:00:00Z" }), null, new Map()),
    toMatchSummary(buildMatch({ matchId: "m_003", kickoffAt: "2026-06-12T19:00:00Z" }), null, new Map())
  ];

  const filtered = applyMatchesCursor(items, "2026-06-11T19:00:00Z::m_001");

  assert.deepEqual(
    filtered.map((item) => item.matchId),
    ["m_002", "m_003"]
  );
});
