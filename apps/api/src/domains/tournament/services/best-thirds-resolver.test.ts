import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { resolveBestThirds, type ThirdPlaceCandidate } from "@prode/shared";

function build(
  groupId: string,
  teamId: string,
  points: number,
  goalDifference: number,
  goalsFor: number,
  teamName = teamId
): ThirdPlaceCandidate {
  return { groupId, teamId, teamName, points, goalDifference, goalsFor };
}

describe("resolveBestThirds", () => {
  it("ranks 12 thirds and advances the top 8 by FIFA tie-break", () => {
    const candidates: ThirdPlaceCandidate[] = [
      build("A", "T_A", 4, 1, 3),
      build("B", "T_B", 4, 2, 4),
      build("C", "T_C", 3, 0, 2),
      build("D", "T_D", 3, 0, 3),
      build("E", "T_E", 3, -1, 2),
      build("F", "T_F", 3, 0, 2, "Aardvark"),
      build("G", "T_G", 6, 3, 5),
      build("H", "T_H", 1, -3, 1),
      build("I", "T_I", 4, 1, 4),
      build("J", "T_J", 2, -2, 1),
      build("K", "T_K", 0, -5, 0),
      build("L", "T_L", 5, 2, 4)
    ];

    const result = resolveBestThirds(candidates);

    assert.equal(result.ranked.length, 12);
    assert.equal(result.top8.length, 8);
    assert.deepEqual(result.ranked.map((row) => row.teamId), [
      "T_G",
      "T_L",
      "T_B",
      "T_I",
      "T_A",
      "T_D",
      "T_F",
      "T_C",
      "T_E",
      "T_J",
      "T_H",
      "T_K"
    ]);
    assert.deepEqual(result.advancingGroupIds, ["G", "L", "B", "I", "A", "D", "F", "C"]);
    assert.deepEqual(
      result.ranked.filter((row) => row.advances).map((row) => row.rank),
      [1, 2, 3, 4, 5, 6, 7, 8]
    );
  });

  it("uses goal difference then goals for as tie-breakers when points match", () => {
    const candidates: ThirdPlaceCandidate[] = [
      build("A", "T_A", 3, 0, 2),
      build("B", "T_B", 3, 0, 3),
      build("C", "T_C", 3, 1, 1)
    ];

    const result = resolveBestThirds(candidates);

    assert.deepEqual(result.ranked.map((row) => row.teamId), ["T_C", "T_B", "T_A"]);
  });

  it("breaks deepest ties deterministically by team name", () => {
    const candidates: ThirdPlaceCandidate[] = [
      build("A", "T_A", 3, 0, 2, "Zeta"),
      build("B", "T_B", 3, 0, 2, "Alpha"),
      build("C", "T_C", 3, 0, 2, "Mike")
    ];

    const result = resolveBestThirds(candidates);

    assert.deepEqual(result.ranked.map((row) => row.teamId), ["T_B", "T_C", "T_A"]);
  });

  it("returns fewer than 8 advancers if fewer candidates are provided", () => {
    const candidates: ThirdPlaceCandidate[] = [
      build("A", "T_A", 3, 0, 2),
      build("B", "T_B", 3, 0, 3)
    ];

    const result = resolveBestThirds(candidates);

    assert.equal(result.top8.length, 2);
    assert.deepEqual(result.advancingGroupIds, ["B", "A"]);
  });
});
