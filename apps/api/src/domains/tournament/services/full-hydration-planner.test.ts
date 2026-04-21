import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  planFullHydration,
  type GroupDefinition,
  type HydrationMatch
} from "@prode/shared";

const GROUPS: GroupDefinition[] = [
  {
    groupId: "A",
    teams: [
      { teamId: "T1A", teamName: "Team 1A" },
      { teamId: "T2A", teamName: "Team 2A" },
      { teamId: "T3A", teamName: "Team 3A" },
      { teamId: "T4A", teamName: "Team 4A" }
    ]
  },
  {
    groupId: "B",
    teams: [
      { teamId: "T1B", teamName: "Team 1B" },
      { teamId: "T2B", teamName: "Team 2B" },
      { teamId: "T3B", teamName: "Team 3B" },
      { teamId: "T4B", teamName: "Team 4B" }
    ]
  }
];

type MatchOverrides = Partial<HydrationMatch> &
  Pick<HydrationMatch, "matchId" | "stage">;

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

/**
 * 6 group matches across groups A and B — 3 per group, making a tiny bracket
 * feasible. All finalized so R32 hydration is ready to fire.
 */
function buildFinalizedGroupMatches(): HydrationMatch[] {
  return [
    buildMatch({
      matchId: "mg_a1",
      stage: "group",
      groupId: "A",
      homeTeamId: "T1A",
      awayTeamId: "T2A",
      homeScore90: 3,
      awayScore90: 0,
      winnerTeamId: "T1A",
      status: "finished"
    }),
    buildMatch({
      matchId: "mg_a2",
      stage: "group",
      groupId: "A",
      homeTeamId: "T3A",
      awayTeamId: "T4A",
      homeScore90: 1,
      awayScore90: 2,
      winnerTeamId: "T4A",
      status: "finished"
    }),
    buildMatch({
      matchId: "mg_a3",
      stage: "group",
      groupId: "A",
      homeTeamId: "T1A",
      awayTeamId: "T4A",
      homeScore90: 2,
      awayScore90: 1,
      winnerTeamId: "T1A",
      status: "finished"
    }),
    buildMatch({
      matchId: "mg_b1",
      stage: "group",
      groupId: "B",
      homeTeamId: "T1B",
      awayTeamId: "T2B",
      homeScore90: 0,
      awayScore90: 1,
      winnerTeamId: "T2B",
      status: "finished"
    }),
    buildMatch({
      matchId: "mg_b2",
      stage: "group",
      groupId: "B",
      homeTeamId: "T3B",
      awayTeamId: "T4B",
      homeScore90: 2,
      awayScore90: 2,
      winnerTeamId: null, // draw – group matches don't need winnerTeamId
      status: "finished"
    }),
    buildMatch({
      matchId: "mg_b3",
      stage: "group",
      groupId: "B",
      homeTeamId: "T2B",
      awayTeamId: "T4B",
      homeScore90: 3,
      awayScore90: 1,
      winnerTeamId: "T2B",
      status: "finished"
    })
  ];
}

describe("planFullHydration", () => {
  it("surfaces phase unlocks as false when group stage is incomplete", () => {
    const groupMatches = buildFinalizedGroupMatches();
    // Last group match unfinished.
    groupMatches[groupMatches.length - 1].homeScore90 = null;
    groupMatches[groupMatches.length - 1].awayScore90 = null;

    const plan = planFullHydration(groupMatches, GROUPS);

    assert.equal(plan.phaseUnlocks.groups, true);
    assert.equal(plan.phaseUnlocks.r32, false);
    assert.equal(plan.phaseUnlocks.r16, false);
    assert.equal(plan.phaseUnlocks.qf, false);
    assert.equal(plan.phaseUnlocks.sf, false);
    assert.equal(plan.phaseUnlocks.bronzeFinal, false);
    assert.equal(plan.allPatches.length, 0);
  });

  it("emits R32 patches and unlocks r32 predictions when group stage closes", () => {
    const plan = planFullHydration(
      [
        ...buildFinalizedGroupMatches(),
        buildMatch({
          matchId: "m_073",
          officialMatchNumber: 73,
          stage: "R32",
          homeSlot: "1A",
          awaySlot: "2B"
        })
      ],
      GROUPS
    );

    assert.equal(plan.phaseUnlocks.r32, true);
    assert.equal(plan.phaseUnlocks.r16, false);
    assert.equal(plan.r32Patches.length, 1);
    assert.equal(plan.knockoutPatches.length, 0);
    assert.equal(plan.allPatches.length, 1);
  });

  it("chains R32 patches through R16 when R32 is closed but R16 planner needs the projected teams", () => {
    // Scenario: group stage closed, R32 finished (with winnerTeamId set) but
    // R32 home/away still hold their slot-projected or null teams until this
    // run hydrates them. R16 points at W73. The wrapper must project the
    // R32 patch in memory before asking the knock-out planner to propagate.
    const r32 = buildMatch({
      matchId: "m_073",
      officialMatchNumber: 73,
      stage: "R32",
      homeSlot: "1A",
      awaySlot: "2B",
      homeTeamId: null,
      awayTeamId: null,
      homeScore90: 2,
      awayScore90: 0,
      winnerTeamId: "T1A",
      status: "finished"
    });
    const r16 = buildMatch({
      matchId: "m_089",
      officialMatchNumber: 89,
      stage: "R16",
      homeSlot: "W73",
      awaySlot: "W74"
    });
    // Only one R32 match here; to satisfy the "round complete" check we
    // give it a winnerTeamId and no other R32 matches exist.

    const plan = planFullHydration([...buildFinalizedGroupMatches(), r32, r16], GROUPS);

    assert.equal(plan.phaseUnlocks.r32, true);
    assert.equal(plan.phaseUnlocks.r16, true);
    // One R32 patch (T1A into home) and one R16 patch (T1A into home).
    assert.equal(plan.r32Patches.length, 1);
    assert.equal(plan.knockoutPatches.length, 1);
    assert.equal(plan.knockoutPatches[0]?.homeTeamId, "T1A");
    // allPatches concatenates both.
    assert.equal(plan.allPatches.length, 2);
  });

  it("aggregates unresolvedSlots from both planners", () => {
    const matches = [
      ...buildFinalizedGroupMatches(),
      buildMatch({
        matchId: "m_073",
        officialMatchNumber: 73,
        stage: "R32",
        homeSlot: "1A",
        awaySlot: "2B",
        homeTeamId: "T1A",
        awayTeamId: "T2B",
        homeScore90: 2,
        awayScore90: 1,
        winnerTeamId: "T1A",
        status: "finished"
      }),
      buildMatch({
        matchId: "m_089",
        officialMatchNumber: 89,
        stage: "R16",
        homeSlot: "W73",
        awaySlot: "W999" // non-existent upstream
      })
    ];

    const plan = planFullHydration(matches, GROUPS);

    assert.ok(plan.unresolvedSlots.includes("W999"));
    assert.equal(plan.phaseUnlocks.r16, true);
  });

  it("reports total and finalized group match counts in the summary", () => {
    const plan = planFullHydration(buildFinalizedGroupMatches(), GROUPS);

    assert.equal(plan.groupMatchesTotal, 6);
    assert.equal(plan.groupMatchesFinalized, 6);
  });
});
