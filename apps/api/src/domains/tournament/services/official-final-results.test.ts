import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { resolveOfficialFinalResults, type OfficialFinalMatchInput } from "@prode/shared";

function build(overrides: Partial<OfficialFinalMatchInput> = {}): OfficialFinalMatchInput {
  return {
    stage: "FINAL",
    status: "finished",
    homeTeamId: "ARG",
    awayTeamId: "BRA",
    winnerTeamId: "ARG",
    ...overrides
  };
}

describe("resolveOfficialFinalResults", () => {
  it("returns champion=winner and subChampion=other when FINAL is finished", () => {
    const result = resolveOfficialFinalResults([build()]);
    assert.deepEqual(result, { championTeamId: "ARG", subChampionTeamId: "BRA" });
  });

  it("inverts home/away correctly when the away team wins", () => {
    const result = resolveOfficialFinalResults([build({ winnerTeamId: "BRA" })]);
    assert.deepEqual(result, { championTeamId: "BRA", subChampionTeamId: "ARG" });
  });

  it("accepts 'corrected' as a finalized status", () => {
    const result = resolveOfficialFinalResults([build({ status: "corrected" })]);
    assert.ok(result);
    assert.equal(result!.championTeamId, "ARG");
  });

  it("ignores non-FINAL matches", () => {
    const result = resolveOfficialFinalResults([
      build({ stage: "SF" }),
      build({ stage: "BRONZE" })
    ]);
    assert.equal(result, null);
  });

  it("returns null when FINAL is still live", () => {
    const result = resolveOfficialFinalResults([build({ status: "live", winnerTeamId: null })]);
    assert.equal(result, null);
  });

  it("returns null when winnerTeamId is missing (draw or not resolved)", () => {
    const result = resolveOfficialFinalResults([build({ winnerTeamId: null })]);
    assert.equal(result, null);
  });

  it("returns null when home or away is missing", () => {
    const resultHome = resolveOfficialFinalResults([build({ homeTeamId: null })]);
    assert.equal(resultHome, null);
    const resultAway = resolveOfficialFinalResults([build({ awayTeamId: null })]);
    assert.equal(resultAway, null);
  });

  it("returns null when winnerTeamId is inconsistent with home/away", () => {
    const result = resolveOfficialFinalResults([
      build({ homeTeamId: "ARG", awayTeamId: "BRA", winnerTeamId: "ESP" })
    ]);
    assert.equal(result, null);
  });

  it("picks the first FINAL if multiple are passed (defensive)", () => {
    const result = resolveOfficialFinalResults([
      build({ homeTeamId: "ARG", awayTeamId: "BRA", winnerTeamId: "ARG" }),
      build({ homeTeamId: "ESP", awayTeamId: "FRA", winnerTeamId: "ESP" })
    ]);
    assert.deepEqual(result, { championTeamId: "ARG", subChampionTeamId: "BRA" });
  });
});
