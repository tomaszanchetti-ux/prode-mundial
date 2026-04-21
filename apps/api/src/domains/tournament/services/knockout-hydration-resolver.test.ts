import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  planKnockoutHydration,
  type HydrationMatch
} from "@prode/shared";

type MatchOverrides = Partial<HydrationMatch> & Pick<HydrationMatch, "matchId" | "stage" | "officialMatchNumber">;

function buildMatch(overrides: MatchOverrides): HydrationMatch {
  return {
    groupId: null,
    homeTeamId: null,
    awayTeamId: null,
    homeSlot: null,
    awaySlot: null,
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    status: "scheduled",
    ...overrides
  };
}

function buildFinishedKnockoutMatch(
  matchId: string,
  officialMatchNumber: number,
  stage: HydrationMatch["stage"],
  homeTeamId: string,
  awayTeamId: string,
  winnerTeamId: string,
  homeSlot: string | null = null,
  awaySlot: string | null = null
): HydrationMatch {
  return buildMatch({
    matchId,
    officialMatchNumber,
    stage,
    homeTeamId,
    awayTeamId,
    homeSlot,
    awaySlot,
    homeScore90: 1,
    awayScore90: 0,
    winnerTeamId,
    status: "finished"
  });
}

/**
 * Builds the 8 R32 matches all finished with canonical teams T01..T16 and
 * predetermined winners (home wins every match for simplicity).
 */
function buildFinishedR32(): HydrationMatch[] {
  return [
    buildFinishedKnockoutMatch("m_073", 73, "R32", "T01", "T02", "T01"),
    buildFinishedKnockoutMatch("m_074", 74, "R32", "T03", "T04", "T03"),
    buildFinishedKnockoutMatch("m_075", 75, "R32", "T05", "T06", "T05"),
    buildFinishedKnockoutMatch("m_076", 76, "R32", "T07", "T08", "T07"),
    buildFinishedKnockoutMatch("m_077", 77, "R32", "T09", "T10", "T09"),
    buildFinishedKnockoutMatch("m_078", 78, "R32", "T11", "T12", "T11"),
    buildFinishedKnockoutMatch("m_079", 79, "R32", "T13", "T14", "T13"),
    buildFinishedKnockoutMatch("m_080", 80, "R32", "T15", "T16", "T15")
  ];
}

function buildEmptyR16(): HydrationMatch[] {
  return [
    buildMatch({
      matchId: "m_089",
      officialMatchNumber: 89,
      stage: "R16",
      homeSlot: "W73",
      awaySlot: "W74"
    }),
    buildMatch({
      matchId: "m_090",
      officialMatchNumber: 90,
      stage: "R16",
      homeSlot: "W75",
      awaySlot: "W76"
    }),
    buildMatch({
      matchId: "m_091",
      officialMatchNumber: 91,
      stage: "R16",
      homeSlot: "W77",
      awaySlot: "W78"
    }),
    buildMatch({
      matchId: "m_092",
      officialMatchNumber: 92,
      stage: "R16",
      homeSlot: "W79",
      awaySlot: "W80"
    })
  ];
}

describe("planKnockoutHydration", () => {
  it("does not produce patches when R32 is incomplete", () => {
    const r32 = buildFinishedR32();
    r32[0].winnerTeamId = null; // last-minute gap
    r32[0].homeScore90 = null;
    r32[0].awayScore90 = null;

    const plan = planKnockoutHydration([...r32, ...buildEmptyR16()]);

    assert.equal(plan.phaseReady.r16, false);
    assert.equal(plan.patches.length, 0);
  });

  it("hydrates every R16 match once R32 is fully finished", () => {
    const plan = planKnockoutHydration([...buildFinishedR32(), ...buildEmptyR16()]);

    assert.equal(plan.phaseReady.r16, true);
    assert.equal(plan.patches.length, 4);

    const byId = new Map(plan.patches.map((patch) => [patch.matchId, patch]));
    // Winners of m_073 and m_074 were T01, T03; R16 m_089 = W73 vs W74.
    assert.equal(byId.get("m_089")?.homeTeamId, "T01");
    assert.equal(byId.get("m_089")?.awayTeamId, "T03");
    // m_092 = W79 vs W80 → T13 vs T15
    assert.equal(byId.get("m_092")?.homeTeamId, "T13");
    assert.equal(byId.get("m_092")?.awayTeamId, "T15");
  });

  it("propagates chained rounds R16 → QF → SF → Bronze/Final when each upstream round is closed", () => {
    const r32 = buildFinishedR32();
    const r16 = [
      buildFinishedKnockoutMatch("m_089", 89, "R16", "T01", "T03", "T01", "W73", "W74"),
      buildFinishedKnockoutMatch("m_090", 90, "R16", "T05", "T07", "T05", "W75", "W76"),
      buildFinishedKnockoutMatch("m_091", 91, "R16", "T09", "T11", "T09", "W77", "W78"),
      buildFinishedKnockoutMatch("m_092", 92, "R16", "T13", "T15", "T13", "W79", "W80")
    ];
    const qf = [
      buildFinishedKnockoutMatch("m_097", 97, "QF", "T01", "T05", "T01", "W89", "W90"),
      buildFinishedKnockoutMatch("m_098", 98, "QF", "T09", "T13", "T09", "W91", "W92"),
      // Minimal bracket collapses: only 2 QF used; SF references these two.
      buildMatch({ matchId: "m_099", officialMatchNumber: 99, stage: "QF", homeSlot: "W89", awaySlot: "W90" }),
      buildMatch({ matchId: "m_100", officialMatchNumber: 100, stage: "QF", homeSlot: "W91", awaySlot: "W92" })
    ];

    // Mark the extra QF also finished so the upstream round is truly complete.
    qf[2] = buildFinishedKnockoutMatch("m_099", 99, "QF", "T01", "T05", "T01", "W89", "W90");
    qf[3] = buildFinishedKnockoutMatch("m_100", 100, "QF", "T09", "T13", "T09", "W91", "W92");

    const sf = [
      buildFinishedKnockoutMatch("m_101", 101, "SF", "T01", "T09", "T01", "W97", "W98"),
      buildFinishedKnockoutMatch("m_102", 102, "SF", "T01", "T09", "T01", "W99", "W100")
    ];
    const bronze = buildMatch({
      matchId: "m_103",
      officialMatchNumber: 103,
      stage: "BRONZE",
      homeSlot: "L101",
      awaySlot: "L102"
    });
    const final = buildMatch({
      matchId: "m_104",
      officialMatchNumber: 104,
      stage: "FINAL",
      homeSlot: "W101",
      awaySlot: "W102"
    });

    const plan = planKnockoutHydration([...r32, ...r16, ...qf, ...sf, bronze, final]);

    assert.equal(plan.phaseReady.r16, true);
    assert.equal(plan.phaseReady.qf, true);
    assert.equal(plan.phaseReady.sf, true);
    assert.equal(plan.phaseReady.bronzeFinal, true);

    const byId = new Map(plan.patches.map((patch) => [patch.matchId, patch]));
    // BRONZE picks losers of SFs.
    assert.equal(byId.get("m_103")?.homeTeamId, "T09"); // loser of m_101
    assert.equal(byId.get("m_103")?.awayTeamId, "T09"); // loser of m_102 (both lost to T01)
    // FINAL picks winners of SFs.
    assert.equal(byId.get("m_104")?.homeTeamId, "T01");
    assert.equal(byId.get("m_104")?.awayTeamId, "T01");
  });

  it("is idempotent: when destination match already matches resolution, no patch is produced", () => {
    const r32 = buildFinishedR32();
    const r16 = buildEmptyR16();
    // Pre-hydrate m_089 to its expected R32 winners.
    r16[0].homeTeamId = "T01";
    r16[0].awayTeamId = "T03";

    const plan = planKnockoutHydration([...r32, ...r16]);

    assert.equal(plan.phaseReady.r16, true);
    // Only 3 patches because m_089 is already hydrated.
    const patchIds = new Set(plan.patches.map((patch) => patch.matchId));
    assert.equal(patchIds.has("m_089"), false);
    assert.equal(plan.patches.length, 3);
  });

  it("gates QF propagation if R16 is partially finished", () => {
    const r32 = buildFinishedR32();
    const r16 = [
      buildFinishedKnockoutMatch("m_089", 89, "R16", "T01", "T03", "T01", "W73", "W74"),
      buildFinishedKnockoutMatch("m_090", 90, "R16", "T05", "T07", "T05", "W75", "W76"),
      // m_091 still pending — no winnerTeamId.
      buildMatch({
        matchId: "m_091",
        officialMatchNumber: 91,
        stage: "R16",
        homeTeamId: "T09",
        awayTeamId: "T11",
        homeSlot: "W77",
        awaySlot: "W78"
      }),
      buildFinishedKnockoutMatch("m_092", 92, "R16", "T13", "T15", "T13", "W79", "W80")
    ];
    const qf = [
      buildMatch({
        matchId: "m_097",
        officialMatchNumber: 97,
        stage: "QF",
        homeSlot: "W89",
        awaySlot: "W90"
      })
    ];

    const plan = planKnockoutHydration([...r32, ...r16, ...qf]);

    assert.equal(plan.phaseReady.r16, true);
    assert.equal(plan.phaseReady.qf, false);
    // No QF patch — upstream R16 still partial.
    assert.equal(
      plan.patches.some((patch) => patch.matchId === "m_097"),
      false
    );
  });

  it("flags unresolved slots when a slot references a non-existent upstream match", () => {
    const r32 = buildFinishedR32();
    const r16 = [
      buildMatch({
        matchId: "m_089",
        officialMatchNumber: 89,
        stage: "R16",
        homeSlot: "W73",
        awaySlot: "W999" // does not exist
      })
    ];

    const plan = planKnockoutHydration([...r32, ...r16]);

    assert.ok(plan.unresolvedSlots.includes("W999"));
    // But home side still resolvable; partial patch is emitted for home.
    assert.equal(plan.patches.length, 1);
    assert.equal(plan.patches[0]?.homeTeamId, "T01");
  });

  it("resolves L{N} slots by deriving the losing team from winnerTeamId", () => {
    const sf = [
      buildFinishedKnockoutMatch("m_101", 101, "SF", "T01", "T09", "T01", "W97", "W98"),
      buildFinishedKnockoutMatch("m_102", 102, "SF", "T05", "T13", "T13", "W99", "W100")
    ];
    const bronze = buildMatch({
      matchId: "m_103",
      officialMatchNumber: 103,
      stage: "BRONZE",
      homeSlot: "L101",
      awaySlot: "L102"
    });

    const plan = planKnockoutHydration([...sf, bronze]);

    assert.equal(plan.phaseReady.bronzeFinal, true);
    assert.equal(plan.patches[0]?.homeTeamId, "T09"); // L101 — the team that is not the winner
    assert.equal(plan.patches[0]?.awayTeamId, "T05"); // L102
  });

  it("does not derive a loser if the upstream match has null homeTeamId/awayTeamId", () => {
    const sf = [
      // Anchored only by winner; teams unknown — pathological but defensive.
      buildMatch({
        matchId: "m_101",
        officialMatchNumber: 101,
        stage: "SF",
        homeTeamId: null,
        awayTeamId: null,
        winnerTeamId: "T01",
        homeScore90: 1,
        awayScore90: 0,
        status: "finished"
      }),
      buildFinishedKnockoutMatch("m_102", 102, "SF", "T05", "T13", "T13", "W99", "W100")
    ];
    const bronze = buildMatch({
      matchId: "m_103",
      officialMatchNumber: 103,
      stage: "BRONZE",
      homeSlot: "L101",
      awaySlot: "L102"
    });

    const plan = planKnockoutHydration([...sf, bronze]);

    assert.ok(plan.unresolvedSlots.includes("L101"));
    // Away side still resolvable.
    assert.equal(plan.patches[0]?.awayTeamId, "T05");
  });

  it("ignores non-knockout matches (group stage) without crashing", () => {
    const groupMatch = buildMatch({
      matchId: "mg_a1",
      officialMatchNumber: 1,
      stage: "group",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      homeScore90: 3,
      awayScore90: 0,
      winnerTeamId: "MEX",
      status: "finished"
    });

    const plan = planKnockoutHydration([groupMatch, ...buildFinishedR32(), ...buildEmptyR16()]);

    assert.equal(plan.phaseReady.r16, true);
    assert.equal(plan.patches.length, 4);
  });

  it("reports phaseReady as false for every downstream round when all knock-out rounds are empty", () => {
    const plan = planKnockoutHydration([]);

    assert.deepEqual(plan.phaseReady, {
      r16: false,
      qf: false,
      sf: false,
      bronzeFinal: false
    });
    assert.equal(plan.patches.length, 0);
  });
});
