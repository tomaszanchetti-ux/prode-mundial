import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  simulateKnockoutBracket,
  type BracketSimulatorMatch,
  type BracketSimulatorPrediction,
  type KnockoutStage
} from "@prode/shared";

function buildMatch(
  matchId: string,
  officialMatchNumber: number,
  stage: KnockoutStage,
  homeSlot: string | null,
  awaySlot: string | null,
  homeTeamId: string | null = null,
  awayTeamId: string | null = null
): BracketSimulatorMatch {
  return {
    matchId,
    officialMatchNumber,
    stage,
    homeSlot,
    awaySlot,
    homeTeamId,
    awayTeamId
  };
}

function buildPrediction(
  matchId: string,
  homeScorePred: number,
  awayScorePred: number
): BracketSimulatorPrediction {
  return { matchId, homeScorePred, awayScorePred };
}

/**
 * Minimal but structurally-complete bracket mirroring FIFA 2026 slot grammar:
 *   - 8 R32 matches (m_073..m_080) anchored with teams T01..T16.
 *   - 4 R16 matches (m_089..m_092) using "W73"..."W80".
 *   - 2 QF matches (m_097, m_098) using "W89"..."W92".
 *   - 2 SF matches (m_101, m_102) using "W97", "W98".
 *   - 1 BRONZE match using "L101" / "L102".
 *   - 1 FINAL match using "W101" / "W102".
 *
 * Match numbers don't cover the full 73..104 span but the grammar is valid:
 * each downstream slot points to an existing upstream match.
 */
function buildMinimalBracket(): BracketSimulatorMatch[] {
  const r32 = [
    buildMatch("m_073", 73, "R32", "1A", "2B", "T01", "T02"),
    buildMatch("m_074", 74, "R32", "1C", "2D", "T03", "T04"),
    buildMatch("m_075", 75, "R32", "1B", "2A", "T05", "T06"),
    buildMatch("m_076", 76, "R32", "1D", "2C", "T07", "T08"),
    buildMatch("m_077", 77, "R32", "1E", "2F", "T09", "T10"),
    buildMatch("m_078", 78, "R32", "1G", "2H", "T11", "T12"),
    buildMatch("m_079", 79, "R32", "1F", "2E", "T13", "T14"),
    buildMatch("m_080", 80, "R32", "1H", "2G", "T15", "T16")
  ];

  const r16 = [
    buildMatch("m_089", 89, "R16", "W73", "W74"),
    buildMatch("m_090", 90, "R16", "W75", "W76"),
    buildMatch("m_091", 91, "R16", "W77", "W78"),
    buildMatch("m_092", 92, "R16", "W79", "W80")
  ];

  const qf = [
    buildMatch("m_097", 97, "QF", "W89", "W90"),
    buildMatch("m_098", 98, "QF", "W91", "W92")
  ];

  const sf = [
    buildMatch("m_101", 101, "SF", "W97", "W98"),
    // Second SF match reuses W97/W98 here only because the minimal bracket
    // collapses to 2 QF → 2 SF teams. Slot grammar is still valid.
    buildMatch("m_102", 102, "SF", "W97", "W98")
  ];

  const bronze = buildMatch("m_103", 103, "BRONZE", "L101", "L102");
  const final = buildMatch("m_104", 104, "FINAL", "W101", "W102");

  return [...r32, ...r16, ...qf, ...sf, bronze, final];
}

describe("simulateKnockoutBracket", () => {
  it("propagates winners from R32 through Final when every prediction is valid", () => {
    const matches = buildMinimalBracket();

    const predictions: BracketSimulatorPrediction[] = [
      buildPrediction("m_073", 2, 1),
      buildPrediction("m_074", 0, 1),
      buildPrediction("m_075", 3, 0),
      buildPrediction("m_076", 1, 2),
      buildPrediction("m_077", 4, 2),
      buildPrediction("m_078", 0, 3),
      buildPrediction("m_079", 1, 0),
      buildPrediction("m_080", 1, 2),

      buildPrediction("m_089", 1, 0),
      buildPrediction("m_090", 2, 1),
      buildPrediction("m_091", 0, 1),
      buildPrediction("m_092", 3, 0),

      buildPrediction("m_097", 1, 2),
      buildPrediction("m_098", 2, 1),

      buildPrediction("m_101", 1, 0),
      buildPrediction("m_102", 0, 1),

      buildPrediction("m_103", 1, 2),
      buildPrediction("m_104", 2, 1)
    ];

    const { matches: simulated, unresolvedMatchIds } = simulateKnockoutBracket({ matches, predictions });

    assert.deepEqual(unresolvedMatchIds, []);

    const byId = new Map(simulated.map((match) => [match.matchId, match]));

    assert.equal(byId.get("m_073")?.winnerTeamId, "T01");
    assert.equal(byId.get("m_074")?.winnerTeamId, "T04");
    assert.equal(byId.get("m_080")?.winnerTeamId, "T16");
    assert.equal(byId.get("m_080")?.loserTeamId, "T15");

    // R16 should be populated from R32 winners.
    const r16First = byId.get("m_089");
    assert.equal(r16First?.homeTeamId, "T01");
    assert.equal(r16First?.awayTeamId, "T04");
    assert.equal(r16First?.winnerTeamId, "T01");
    assert.equal(r16First?.source, "projected");

    // Final is W101 vs W102.
    const final = byId.get("m_104");
    assert.equal(final?.homeTeamId, byId.get("m_101")?.winnerTeamId);
    assert.equal(final?.awayTeamId, byId.get("m_102")?.winnerTeamId);
    assert.equal(final?.winnerTeamId, final?.homeTeamId);

    // Bronze is L101 vs L102.
    const bronze = byId.get("m_103");
    assert.equal(bronze?.homeTeamId, byId.get("m_101")?.loserTeamId);
    assert.equal(bronze?.awayTeamId, byId.get("m_102")?.loserTeamId);
  });

  it("flags upstream matches with no anchor and no prediction as unresolved and halts downstream", () => {
    const matches = [
      buildMatch("m_073", 73, "R32", "1A", "2B"), // no anchor
      buildMatch("m_089", 89, "R16", "W73", "W74")
    ];

    const { matches: simulated, unresolvedMatchIds } = simulateKnockoutBracket({
      matches,
      predictions: []
    });

    assert.ok(unresolvedMatchIds.includes("m_073"));
    assert.ok(unresolvedMatchIds.includes("m_089"));

    const r32 = simulated.find((match) => match.matchId === "m_073");
    assert.equal(r32?.source, "unresolved");
    assert.equal(r32?.homeTeamId, null);
    assert.equal(r32?.winnerTeamId, null);

    const r16 = simulated.find((match) => match.matchId === "m_089");
    assert.equal(r16?.homeTeamId, null);
    assert.equal(r16?.awayTeamId, null);
  });

  it("treats knockout draws as unresolved (EPIC 24: bracket no avanza en empates)", () => {
    const matches = [buildMatch("m_073", 73, "R32", "1A", "2B", "T01", "T02")];

    const drawScoreless = simulateKnockoutBracket({
      matches,
      predictions: [buildPrediction("m_073", 0, 0)]
    });

    assert.equal(drawScoreless.matches[0]?.winnerTeamId, null);
    assert.equal(drawScoreless.matches[0]?.loserTeamId, null);

    const drawWithGoals = simulateKnockoutBracket({
      matches,
      predictions: [buildPrediction("m_073", 2, 2)]
    });

    assert.equal(drawWithGoals.matches[0]?.winnerTeamId, null);
  });

  it("prefers anchored team IDs over slot resolution and marks source as anchored", () => {
    const matches = [
      buildMatch("m_073", 73, "R32", "1A", "2B", "T01", "T02"),
      // R16 match pre-anchored with real teams from an officially closed round,
      // even though W73 would project to T01.
      buildMatch("m_089", 89, "R16", "W73", "W74", "REAL_X", "REAL_Y")
    ];

    const { matches: simulated } = simulateKnockoutBracket({
      matches,
      predictions: [buildPrediction("m_073", 2, 0), buildPrediction("m_089", 1, 0)]
    });

    const r16 = simulated.find((match) => match.matchId === "m_089");

    assert.equal(r16?.homeTeamId, "REAL_X");
    assert.equal(r16?.awayTeamId, "REAL_Y");
    assert.equal(r16?.winnerTeamId, "REAL_X");
    assert.equal(r16?.source, "anchored");
  });

  it("labels projected matches as 'projected' even when anchored team was already derived upstream", () => {
    const matches = [
      buildMatch("m_073", 73, "R32", "1A", "2B", "T01", "T02"),
      buildMatch("m_074", 74, "R32", "1C", "2D", "T03", "T04"),
      buildMatch("m_089", 89, "R16", "W73", "W74")
    ];

    const { matches: simulated } = simulateKnockoutBracket({
      matches,
      predictions: [
        buildPrediction("m_073", 2, 0),
        buildPrediction("m_074", 0, 1),
        buildPrediction("m_089", 1, 2)
      ]
    });

    const r16 = simulated.find((match) => match.matchId === "m_089");

    assert.equal(r16?.homeTeamId, "T01");
    assert.equal(r16?.awayTeamId, "T04");
    assert.equal(r16?.source, "projected");
    assert.equal(r16?.winnerTeamId, "T04");
  });

  it("propagates unresolvedness when an upstream match has no prediction", () => {
    const matches = [
      buildMatch("m_073", 73, "R32", "1A", "2B", "T01", "T02"),
      buildMatch("m_074", 74, "R32", "1C", "2D", "T03", "T04"),
      buildMatch("m_089", 89, "R16", "W73", "W74")
    ];

    const { matches: simulated, unresolvedMatchIds } = simulateKnockoutBracket({
      matches,
      predictions: [buildPrediction("m_073", 2, 0)] // m_074 has no prediction
    });

    const r16 = simulated.find((match) => match.matchId === "m_089");
    const r32Missing = simulated.find((match) => match.matchId === "m_074");

    // m_074 has anchored teams so it is NOT in unresolvedMatchIds, but its
    // winner is null — which cascades into R16.
    assert.equal(r32Missing?.homeTeamId, "T03");
    assert.equal(r32Missing?.awayTeamId, "T04");
    assert.equal(r32Missing?.winnerTeamId, null);

    assert.equal(r16?.homeTeamId, "T01");
    assert.equal(r16?.awayTeamId, null);
    assert.ok(unresolvedMatchIds.includes("m_089"));
    assert.ok(!unresolvedMatchIds.includes("m_074"));
  });

  it("resolves W{N} / L{N} slots against the referenced officialMatchNumber", () => {
    const matches = [
      // SF matches anchored directly for isolation, listed out of order
      // to prove resolution goes by officialMatchNumber, not array order.
      buildMatch("m_102", 102, "SF", null, null, "S2_HOME", "S2_AWAY"),
      buildMatch("m_101", 101, "SF", null, null, "S1_HOME", "S1_AWAY"),
      buildMatch("m_103", 103, "BRONZE", "L101", "L102"),
      buildMatch("m_104", 104, "FINAL", "W101", "W102")
    ];

    const { matches: simulated } = simulateKnockoutBracket({
      matches,
      predictions: [
        buildPrediction("m_101", 2, 1),
        buildPrediction("m_102", 0, 3)
      ]
    });

    const bronze = simulated.find((match) => match.matchId === "m_103");
    const final = simulated.find((match) => match.matchId === "m_104");

    assert.equal(bronze?.homeTeamId, "S1_AWAY"); // loser of m_101
    assert.equal(bronze?.awayTeamId, "S2_HOME"); // loser of m_102

    assert.equal(final?.homeTeamId, "S1_HOME"); // winner of m_101
    assert.equal(final?.awayTeamId, "S2_AWAY"); // winner of m_102
  });

  it("leaves a match unresolved if its slot references a non-existent upstream match", () => {
    const matches = [buildMatch("m_089", 89, "R16", "W73", "W74")];

    const { matches: simulated, unresolvedMatchIds } = simulateKnockoutBracket({
      matches,
      predictions: []
    });

    assert.equal(simulated[0]?.homeTeamId, null);
    assert.equal(simulated[0]?.awayTeamId, null);
    assert.ok(unresolvedMatchIds.includes("m_089"));
  });
});
