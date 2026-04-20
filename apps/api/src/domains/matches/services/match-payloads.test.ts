import assert from "node:assert/strict";
import test from "node:test";
import type { StoredMatch, StoredPrediction } from "../types";
import {
  applyMatchesCursor,
  buildTournamentContext,
  deriveMatchViewState,
  toMatchSummary
} from "./match-payloads";

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
    new Date("2026-06-11T15:00:00Z")
  );

  assert.equal(state.isEditable, true);
  assert.equal(state.matchState, "EDITABLE");
  assert.equal(state.predictionStatus, "saved_editable");
  assert.equal(state.ctaLabel, "Editar");
});

test("deriveMatchViewState marks scheduled matches as editable well before kickoff (no opening window)", () => {
  const state = deriveMatchViewState(
    buildMatch(),
    null,
    new Date("2026-04-15T12:30:00Z")
  );

  assert.equal(state.isEditable, true);
  assert.equal(state.matchState, "EDITABLE");
  assert.equal(state.ctaLabel, "Predecir");
});

test("deriveMatchViewState locks scheduled matches within 1 hour of kickoff", () => {
  const state = deriveMatchViewState(
    buildMatch(),
    null,
    new Date("2026-06-11T18:30:00Z")
  );

  assert.equal(state.isEditable, false);
  assert.equal(state.matchState, "LOCKED_PENDING");
});

test("toMatchSummary resolves knockout placeholders from bracket slots", () => {
  const summary = toMatchSummary(
    buildMatch({
      matchId: "m_073",
      stage: "R32",
      groupId: null,
      kickoffAt: "2026-06-27T19:00:00Z",
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
  assert.equal(summary.isFinished, false);
  assert.equal(summary.isScored, false);
  assert.equal(summary.predictionOpensAt, "2026-04-09T00:00:00.000Z");
});

test("deriveMatchViewState forces isEditable=false for knockout match with unresolved slots", () => {
  // R32 match before group stage closes: homeTeamId/awayTeamId still null.
  // Even though scheduled + far from kickoff, phase lock should kick in.
  const r32Match = buildMatch({
    matchId: "m_073",
    stage: "R32",
    groupId: null,
    homeTeamId: null,
    awayTeamId: null,
    homeSlot: "W49",
    awaySlot: "W50",
    kickoffAt: "2026-06-27T19:00:00Z"
  });

  const state = deriveMatchViewState(r32Match, null, new Date("2026-06-15T00:00:00Z"));

  assert.equal(state.isEditable, false);
  assert.equal(state.ctaLabel, "Bloqueado");
});

test("deriveMatchViewState forces isEditable=false when match's stage is fully finished via context", () => {
  // Group match still scheduled (theoretically editable individually) BUT
  // every other group match is finished → phase locked, no point editing.
  const targetMatch = buildMatch({
    matchId: "m_001",
    stage: "group",
    kickoffAt: "2026-06-30T19:00:00Z" // far from kickoff
  });

  const allMatches = [
    { stage: "group", status: "finished" },
    { stage: "group", status: "finished" },
    { stage: "group", status: "finished" }
  ];
  const context = buildTournamentContext(allMatches);

  const state = deriveMatchViewState(targetMatch, null, new Date("2026-04-15T00:00:00Z"), context);

  assert.equal(state.isEditable, false);
  assert.equal(state.ctaLabel, "Bloqueado");
});

test("deriveMatchViewState keeps isEditable=true when stage has matches still scheduled", () => {
  const targetMatch = buildMatch({ matchId: "m_001", stage: "group" });

  const allMatches = [
    { stage: "group", status: "finished" },
    { stage: "group", status: "scheduled" },
    { stage: "group", status: "scheduled" }
  ];
  const context = buildTournamentContext(allMatches);

  const state = deriveMatchViewState(targetMatch, null, new Date("2026-04-15T00:00:00Z"), context);

  assert.equal(state.isEditable, true);
  assert.equal(state.ctaLabel, "Predecir");
});

test("deriveMatchViewState downgrades saved_editable to locked_unscored when phase locked", () => {
  const targetMatch = buildMatch({ matchId: "m_001", stage: "group" });
  const prediction = buildPrediction();

  const allMatches = [
    { stage: "group", status: "finished" },
    { stage: "group", status: "finished" }
  ];
  const context = buildTournamentContext(allMatches);

  const state = deriveMatchViewState(targetMatch, prediction, new Date("2026-04-15T00:00:00Z"), context);

  assert.equal(state.isEditable, false);
  assert.equal(state.predictionStatus, "locked_unscored");
  assert.equal(state.ctaLabel, "Bloqueado");
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
