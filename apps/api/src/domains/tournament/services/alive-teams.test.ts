import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  resolveAliveTeamsAfterGroups,
  type TournamentProjectionBracket,
  type TournamentProjectionMatch,
  type TournamentProjectionSide
} from "@prode/shared";

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

function buildR32Only(teamsByR32Number: Record<number, TeamPair> = {}): TournamentProjectionBracket {
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
  return {
    round32: r32,
    round16: [],
    quarterfinals: [],
    semifinals: [],
    bronze: [],
    final: []
  };
}

describe("resolveAliveTeamsAfterGroups", () => {
  it("returns an empty Set when no teams are assigned to R32", () => {
    const bracket = buildR32Only();
    const alive = resolveAliveTeamsAfterGroups(bracket);
    assert.equal(alive.size, 0);
  });

  it("returns an empty Set when the bracket has no R32 matches at all", () => {
    const bracket = buildR32Only();
    bracket.round32 = [];
    const alive = resolveAliveTeamsAfterGroups(bracket);
    assert.equal(alive.size, 0);
  });

  it("collects every teamId present in R32 home+away sides", () => {
    const bracket = buildR32Only({
      73: ["ARG", "CRO"],
      74: ["BRA", "MEX"],
      85: ["FRA", "POR"]
    });
    const alive = resolveAliveTeamsAfterGroups(bracket);
    assert.equal(alive.size, 6);
    assert.ok(alive.has("ARG"));
    assert.ok(alive.has("CRO"));
    assert.ok(alive.has("BRA"));
    assert.ok(alive.has("MEX"));
    assert.ok(alive.has("FRA"));
    assert.ok(alive.has("POR"));
  });

  it("skips sides that don't have a team assigned yet", () => {
    const bracket = buildR32Only({ 73: ["ARG", null], 74: [null, "BRA"] });
    const alive = resolveAliveTeamsAfterGroups(bracket);
    assert.equal(alive.size, 2);
    assert.ok(alive.has("ARG"));
    assert.ok(alive.has("BRA"));
  });

  it("de-duplicates repeated teamIds across R32 matches", () => {
    // Shouldn't happen in practice (a team can only play once in R32), but
    // the helper is defensive — same teamId twice produces one entry.
    const bracket = buildR32Only({
      73: ["ARG", "CRO"],
      80: ["ARG", "MEX"]
    });
    const alive = resolveAliveTeamsAfterGroups(bracket);
    assert.equal(alive.size, 3);
    assert.ok(alive.has("ARG"));
    assert.ok(alive.has("CRO"));
    assert.ok(alive.has("MEX"));
  });
});
