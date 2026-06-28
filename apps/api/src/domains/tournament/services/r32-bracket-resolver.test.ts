import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  resolveR32Bracket,
  type GroupStandingPosition,
  type R32SlotDefinition,
  type ResolvedGroupStandings
} from "@prode/shared";

function buildStandings(
  groupId: string,
  rows: [teamId: string, points: number, gd: number, gf: number][]
): ResolvedGroupStandings {
  const positions: GroupStandingPosition[] = rows.map(([teamId, points, goalDifference, goalsFor], index) => ({
    position: (index + 1) as 1 | 2 | 3,
    teamId,
    teamName: teamId,
    points,
    goalDifference,
    goalsFor
  }));

  return { groupId, positions };
}

const ALL_TWELVE_GROUPS: ResolvedGroupStandings[] = [
  buildStandings("A", [
    ["A1", 9, 6, 7],
    ["A2", 6, 2, 4],
    ["A3", 3, -1, 2],
    ["A4", 0, -7, 0]
  ]),
  buildStandings("B", [
    ["B1", 9, 5, 6],
    ["B2", 6, 1, 3],
    ["B3", 4, 0, 3],
    ["B4", 0, -6, 1]
  ]),
  buildStandings("C", [
    ["C1", 9, 7, 8],
    ["C2", 6, 2, 5],
    ["C3", 3, -2, 2],
    ["C4", 0, -7, 1]
  ]),
  buildStandings("D", [
    ["D1", 9, 4, 5],
    ["D2", 6, 2, 4],
    ["D3", 4, 1, 3],
    ["D4", 0, -7, 0]
  ]),
  buildStandings("E", [
    ["E1", 9, 5, 6],
    ["E2", 6, 1, 4],
    ["E3", 1, -2, 1],
    ["E4", 1, -4, 1]
  ]),
  buildStandings("F", [
    ["F1", 9, 6, 7],
    ["F2", 6, 3, 5],
    ["F3", 3, 0, 3],
    ["F4", 0, -9, 0]
  ]),
  buildStandings("G", [
    ["G1", 9, 4, 5],
    ["G2", 6, 1, 3],
    ["G3", 4, 1, 4],
    ["G4", 0, -6, 1]
  ]),
  buildStandings("H", [
    ["H1", 9, 5, 6],
    ["H2", 6, 2, 4],
    ["H3", 3, -1, 2],
    ["H4", 0, -6, 1]
  ]),
  buildStandings("I", [
    ["I1", 9, 6, 7],
    ["I2", 6, 2, 4],
    ["I3", 4, 1, 3],
    ["I4", 0, -9, 0]
  ]),
  buildStandings("J", [
    ["J1", 9, 4, 5],
    ["J2", 6, 2, 4],
    ["J3", 2, -1, 2],
    ["J4", 1, -5, 1]
  ]),
  buildStandings("K", [
    ["K1", 9, 6, 7],
    ["K2", 6, 2, 4],
    ["K3", 0, -3, 1],
    ["K4", 0, -5, 1]
  ]),
  buildStandings("L", [
    ["L1", 9, 5, 6],
    ["L2", 6, 2, 4],
    ["L3", 0, -4, 1],
    ["L4", 0, -3, 1]
  ])
];

const R32_SLOT_DEFINITIONS: R32SlotDefinition[] = [
  { matchId: "m_073", homeSlot: "2A", awaySlot: "2B" },
  { matchId: "m_074", homeSlot: "1E", awaySlot: "3ABCDF" },
  { matchId: "m_075", homeSlot: "1F", awaySlot: "2C" },
  { matchId: "m_076", homeSlot: "1C", awaySlot: "2F" },
  { matchId: "m_077", homeSlot: "1I", awaySlot: "3CDFGH" },
  { matchId: "m_078", homeSlot: "2E", awaySlot: "2I" },
  { matchId: "m_079", homeSlot: "1A", awaySlot: "3CEFHI" },
  { matchId: "m_080", homeSlot: "1L", awaySlot: "3EHIJK" },
  { matchId: "m_081", homeSlot: "1D", awaySlot: "3BEFIJ" },
  { matchId: "m_082", homeSlot: "1G", awaySlot: "3AEHIJ" },
  { matchId: "m_083", homeSlot: "2K", awaySlot: "2L" },
  { matchId: "m_084", homeSlot: "1H", awaySlot: "2J" },
  { matchId: "m_085", homeSlot: "1B", awaySlot: "3EFGIJ" },
  { matchId: "m_086", homeSlot: "1J", awaySlot: "2H" },
  { matchId: "m_087", homeSlot: "1K", awaySlot: "3DEIJL" },
  { matchId: "m_088", homeSlot: "2D", awaySlot: "2G" }
];

describe("resolveR32Bracket", () => {
  it("resolves every fixed slot from winners and runners-up", () => {
    const { matches } = resolveR32Bracket(ALL_TWELVE_GROUPS, R32_SLOT_DEFINITIONS);
    const byMatchId = new Map(matches.map((match) => [match.matchId, match]));

    assert.equal(byMatchId.get("m_073")?.homeTeamId, "A2");
    assert.equal(byMatchId.get("m_073")?.awayTeamId, "B2");
    assert.equal(byMatchId.get("m_074")?.homeTeamId, "E1");
    assert.equal(byMatchId.get("m_079")?.homeTeamId, "A1");
    assert.equal(byMatchId.get("m_088")?.homeTeamId, "D2");
    assert.equal(byMatchId.get("m_088")?.awayTeamId, "G2");
  });

  it("assigns a distinct advancing third to each third slot", () => {
    const { matches, bestThirds, thirdsBySlot } = resolveR32Bracket(ALL_TWELVE_GROUPS, R32_SLOT_DEFINITIONS);

    const advancing = bestThirds.filter((row) => row.advances);
    assert.equal(advancing.length, 8);

    const thirdAssignments = Object.values(thirdsBySlot).filter((teamId): teamId is string => teamId !== null);
    assert.equal(thirdAssignments.length, 8);
    assert.equal(new Set(thirdAssignments).size, 8, "each third should appear at most once across R32 slots");

    const assignedTeamIds = new Set(thirdAssignments);
    for (const third of advancing) {
      assert.ok(assignedTeamIds.has(third.teamId), `third ${third.teamId} (group ${third.groupId}) should be assigned`);
    }

    const allR32TeamIds = matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]);
    assert.ok(!allR32TeamIds.includes(null), "every R32 slot should resolve with 12 complete groups");
  });

  it("respects the candidate group constraint of each third slot", () => {
    const { thirdsBySlot, bestThirds } = resolveR32Bracket(ALL_TWELVE_GROUPS, R32_SLOT_DEFINITIONS);

    const thirdByTeamId = new Map(bestThirds.map((row) => [row.teamId, row]));

    for (const [slot, teamId] of Object.entries(thirdsBySlot)) {
      if (teamId === null) {
        continue;
      }

      const allowedGroups = slot.slice(1).split("");
      const third = thirdByTeamId.get(teamId);

      assert.ok(third, `teamId ${teamId} should be a known third`);
      assert.ok(
        allowedGroups.includes(third.groupId),
        `slot ${slot} accepts groups ${allowedGroups.join(",")} but got ${third.groupId}`
      );
    }
  });

  it("reports unresolved slots when a group is missing", () => {
    const partial = ALL_TWELVE_GROUPS.filter((group) => group.groupId !== "L");
    const slots: R32SlotDefinition[] = [
      { matchId: "m_080", homeSlot: "1L", awaySlot: "3EHIJK" },
      { matchId: "m_083", homeSlot: "2K", awaySlot: "2L" }
    ];

    const { matches, unresolvedSlots } = resolveR32Bracket(partial, slots);

    assert.equal(matches.find((match) => match.matchId === "m_080")?.homeTeamId, null);
    assert.equal(matches.find((match) => match.matchId === "m_083")?.awayTeamId, null);
    assert.ok(unresolvedSlots.includes("1L"));
    assert.ok(unresolvedSlots.includes("2L"));
  });

  it("matches the official FIFA table for the live combination (thirds from B,D,E,F,I,J,K,L)", () => {
    // Thirds advancing from B,D,E,F,I,J,K,L (4 pts) over A,C,G,H (1 pt). This is
    // the real Round-of-32 combination of WC 2026 (USA vs Bosnia, Germany vs
    // Paraguay, Mexico vs Ecuador, Belgium vs Senegal, …). The previous greedy
    // matcher left m_081 (USA) without a rival and stranded Paraguay.
    const advancing = new Set(["B", "D", "E", "F", "I", "J", "K", "L"]);
    const standings = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((groupId) => {
      const thirdPoints = advancing.has(groupId) ? 4 : 1;
      const thirdGd = advancing.has(groupId) ? 0 : -3;
      return buildStandings(groupId, [
        [`${groupId}1`, 9, 5, 6],
        [`${groupId}2`, 6, 1, 3],
        [`${groupId}3`, thirdPoints, thirdGd, advancing.has(groupId) ? 3 : 1],
        [`${groupId}4`, 0, -6, 0]
      ]);
    });

    const { matches, unresolvedSlots } = resolveR32Bracket(standings, R32_SLOT_DEFINITIONS);
    const away = (matchId: string) => matches.find((match) => match.matchId === matchId)?.awayTeamId;

    // Official Annex C allocation for {B,D,E,F,I,J,K,L}: 1A-3E, 1B-3J, 1D-3B,
    // 1E-3D, 1G-3I, 1I-3F, 1K-3L, 1L-3K.
    assert.equal(away("m_079"), "E3", "1A (Mexico) faces 3E (Ecuador)");
    assert.equal(away("m_085"), "J3", "1B (Switzerland) faces 3J (Algeria)");
    assert.equal(away("m_081"), "B3", "1D (USA) faces 3B (Bosnia) — was empty under greedy");
    assert.equal(away("m_074"), "D3", "1E (Germany) faces 3D (Paraguay) — was stranded under greedy");
    assert.equal(away("m_082"), "I3", "1G (Belgium) faces 3I (Senegal)");
    assert.equal(away("m_077"), "F3", "1I (France) faces 3F (Sweden)");
    assert.equal(away("m_087"), "L3", "1K (Colombia) faces 3L (Ghana)");
    assert.equal(away("m_080"), "K3", "1L (England) faces 3K (DR Congo)");

    assert.deepEqual(unresolvedSlots, [], "every slot resolves with eight advancing thirds");
  });

  it("is deterministic across calls with identical input", () => {
    const first = resolveR32Bracket(ALL_TWELVE_GROUPS, R32_SLOT_DEFINITIONS);
    const second = resolveR32Bracket(ALL_TWELVE_GROUPS, R32_SLOT_DEFINITIONS);

    assert.deepEqual(first.thirdsBySlot, second.thirdsBySlot);
    assert.deepEqual(
      first.matches.map((match) => [match.matchId, match.homeTeamId, match.awayTeamId]),
      second.matches.map((match) => [match.matchId, match.homeTeamId, match.awayTeamId])
    );
  });
});
