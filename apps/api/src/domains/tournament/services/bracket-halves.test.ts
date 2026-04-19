import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  classifyMatchBracketHalves,
  classifyTeamBracketHalves,
  validateSubChampionHalf,
  type TournamentProjectionBracket,
  type TournamentProjectionMatch,
  type TournamentProjectionSide
} from "@prode/shared";

// ─── Fixture helpers ────────────────────────────────────
//
// We build a minimal FIFA 2026-shaped bracket: 16 R32 → 8 R16 → 4 QF → 2 SF
// → 1 Final (+ 1 Bronze). Official match numbers follow FIFA conventions
// (R32 = M73..M88, R16 = M89..M96, QF = M97..M100, SF = M101..M102,
// Bronze = M103, Final = M104). slotLabels reference feeder matches via
// the M{N} grammar.

type TeamPair = [string | null, string | null];

function side(team: string | null, slotLabel: string): TournamentProjectionSide {
  return {
    team: team
      ? {
          teamId: team,
          name: team,
          fifaCode: team,
          iso2: null,
          iso3: null,
          flagAsset: null,
          flagUrl: null
        }
      : null,
    slot: slotLabel,
    slotLabel
  };
}

function buildMatch(
  matchId: string,
  officialMatchNumber: number,
  stage: TournamentProjectionMatch["stage"],
  homeSlotLabel: string,
  awaySlotLabel: string,
  teams: TeamPair = [null, null]
): TournamentProjectionMatch {
  return {
    matchId,
    officialMatchNumber,
    stage,
    kickoffAt: "2026-06-30T19:00:00.000Z",
    kickoffAtEt: null,
    venueId: null,
    home: side(teams[0], homeSlotLabel),
    away: side(teams[1], awaySlotLabel),
    winnerTeamId: null,
    source: "projected"
  };
}

/**
 * Standard FIFA 2026 topology. Pair grouping matches what the Y-connector
 * visual expects: (M73+M74)→M89, (M75+M76)→M90, etc.
 */
function buildFullBracket(teamsByR32Number: Record<number, TeamPair> = {}): TournamentProjectionBracket {
  const r32 = Array.from({ length: 16 }, (_, i) => {
    const num = 73 + i;
    return buildMatch(
      `r32_${num}`,
      num,
      "R32",
      `1A_${num}`,
      `2B_${num}`,
      teamsByR32Number[num] ?? [null, null]
    );
  });

  // R16 pairs: (73,74)→89, (75,76)→90, ...
  const r16 = Array.from({ length: 8 }, (_, i) => {
    const num = 89 + i;
    const h = 73 + i * 2;
    const a = 74 + i * 2;
    return buildMatch(`r16_${num}`, num, "R16", `W(M${h})`, `W(M${a})`);
  });

  // QF pairs: (89,90)→97, (91,92)→98, (93,94)→99, (95,96)→100
  const qf = Array.from({ length: 4 }, (_, i) => {
    const num = 97 + i;
    const h = 89 + i * 2;
    const a = 90 + i * 2;
    return buildMatch(`qf_${num}`, num, "QF", `W(M${h})`, `W(M${a})`);
  });

  // SF pairs: (97,98)→101, (99,100)→102
  const sf = [
    buildMatch("sf_101", 101, "SF", "W(M97)", "W(M98)"),
    buildMatch("sf_102", 102, "SF", "W(M99)", "W(M100)")
  ];

  const bronze = [buildMatch("bronze_103", 103, "BRONZE", "L(M101)", "L(M102)")];
  const finalMatch = [buildMatch("final_104", 104, "FINAL", "W(M101)", "W(M102)")];

  return {
    round32: r32,
    round16: r16,
    quarterfinals: qf,
    semifinals: sf,
    bronze,
    final: finalMatch
  };
}

// ─── Tests ──────────────────────────────────────────────

describe("classifyMatchBracketHalves", () => {
  it("assigns A to the SF that feeds the home side of the Final", () => {
    const bracket = buildFullBracket();
    const halves = classifyMatchBracketHalves(bracket);
    assert.equal(halves.get("sf_101"), "A");
  });

  it("assigns B to the SF that feeds the away side of the Final", () => {
    const bracket = buildFullBracket();
    const halves = classifyMatchBracketHalves(bracket);
    assert.equal(halves.get("sf_102"), "B");
  });

  it("propagates half A through QF → R16 → R32 on the home subtree", () => {
    const bracket = buildFullBracket();
    const halves = classifyMatchBracketHalves(bracket);
    // QF 97 + 98 → SF 101 (A)
    assert.equal(halves.get("qf_97"), "A");
    assert.equal(halves.get("qf_98"), "A");
    // R16 89..92 all in A (feed QFs 97 and 98)
    for (const num of [89, 90, 91, 92]) {
      assert.equal(halves.get(`r16_${num}`), "A", `r16_${num} should be A`);
    }
    // R32 73..80 all in A (feed R16 89..92)
    for (let num = 73; num <= 80; num += 1) {
      assert.equal(halves.get(`r32_${num}`), "A", `r32_${num} should be A`);
    }
  });

  it("propagates half B through the away subtree", () => {
    const bracket = buildFullBracket();
    const halves = classifyMatchBracketHalves(bracket);
    assert.equal(halves.get("qf_99"), "B");
    assert.equal(halves.get("qf_100"), "B");
    for (const num of [93, 94, 95, 96]) {
      assert.equal(halves.get(`r16_${num}`), "B");
    }
    for (let num = 81; num <= 88; num += 1) {
      assert.equal(halves.get(`r32_${num}`), "B");
    }
  });

  it("keeps Final and Bronze as neutral", () => {
    const bracket = buildFullBracket();
    const halves = classifyMatchBracketHalves(bracket);
    assert.equal(halves.get("final_104"), "neutral");
    assert.equal(halves.get("bronze_103"), "neutral");
  });

  it("returns an empty map when the Final is missing", () => {
    const bracket = buildFullBracket();
    bracket.final = [];
    const halves = classifyMatchBracketHalves(bracket);
    assert.equal(halves.size, 0);
  });
});

describe("classifyTeamBracketHalves", () => {
  it("maps both home and away teams of an R32 match to the match's half", () => {
    const bracket = buildFullBracket({
      73: ["ARG", "CRC"],  // half A (r32_73 → r16_89 → qf_97 → sf_101)
      85: ["BRA", "URU"]   // half B (r32_85 → r16_94 → qf_99 → sf_102)
    });
    const teamHalves = classifyTeamBracketHalves(bracket);
    assert.equal(teamHalves.get("ARG"), "A");
    assert.equal(teamHalves.get("CRC"), "A");
    assert.equal(teamHalves.get("BRA"), "B");
    assert.equal(teamHalves.get("URU"), "B");
  });

  it("skips R32 sides that don't have a team assigned yet", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null] });
    const teamHalves = classifyTeamBracketHalves(bracket);
    assert.equal(teamHalves.get("ARG"), "A");
    assert.equal(teamHalves.size, 1);
  });
});

describe("validateSubChampionHalf", () => {
  function halvesFromBracket(teamsByR32Number: Record<number, TeamPair>): Map<string, "A" | "B" | "neutral"> {
    return classifyTeamBracketHalves(buildFullBracket(teamsByR32Number));
  }

  it("accepts when champion and sub-champion are in opposite halves", () => {
    const halves = halvesFromBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const result = validateSubChampionHalf("ARG", "BRA", halves);
    assert.deepEqual(result, { valid: true });
  });

  it("rejects with SAME_TEAM when both picks are the same team", () => {
    const halves = halvesFromBracket({ 73: ["ARG", null] });
    const result = validateSubChampionHalf("ARG", "ARG", halves);
    assert.deepEqual(result, { valid: false, reason: "SAME_TEAM" });
  });

  it("rejects with SAME_HALF when both teams are in half A", () => {
    const halves = halvesFromBracket({ 73: ["ARG", null], 77: ["MEX", null] });
    const result = validateSubChampionHalf("ARG", "MEX", halves);
    assert.deepEqual(result, { valid: false, reason: "SAME_HALF" });
  });

  it("rejects with SAME_HALF when both teams are in half B", () => {
    const halves = halvesFromBracket({ 85: ["BRA", null], 87: ["POR", null] });
    const result = validateSubChampionHalf("BRA", "POR", halves);
    assert.deepEqual(result, { valid: false, reason: "SAME_HALF" });
  });

  it("rejects with UNRESOLVED_HALF when champion has no known half", () => {
    const halves = halvesFromBracket({ 85: ["BRA", null] });
    const result = validateSubChampionHalf("ARG", "BRA", halves);
    assert.deepEqual(result, { valid: false, reason: "UNRESOLVED_HALF" });
  });

  it("rejects with UNRESOLVED_HALF when sub-champion has no known half", () => {
    const halves = halvesFromBracket({ 73: ["ARG", null] });
    const result = validateSubChampionHalf("ARG", "BRA", halves);
    assert.deepEqual(result, { valid: false, reason: "UNRESOLVED_HALF" });
  });
});
