import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { computeStageCompletion, isPhaseComplete, type PhaseCompletionMatch } from "@prode/shared";

function match(stage: string, status: string): PhaseCompletionMatch {
  return { stage, status };
}

describe("isPhaseComplete", () => {
  it("returns false for an empty matches list", () => {
    assert.equal(isPhaseComplete("group", []), false);
  });

  it("returns false when the requested stage has no matches", () => {
    const matches = [match("R32", "finished"), match("R32", "finished")];
    assert.equal(isPhaseComplete("group", matches), false);
  });

  it("returns true when every match of the stage is finished", () => {
    const matches = [match("group", "finished"), match("group", "finished"), match("group", "finished")];
    assert.equal(isPhaseComplete("group", matches), true);
  });

  it("returns false when at least one match of the stage is still scheduled", () => {
    const matches = [match("group", "finished"), match("group", "scheduled")];
    assert.equal(isPhaseComplete("group", matches), false);
  });

  it("returns false when a match of the stage is live", () => {
    const matches = [match("group", "finished"), match("group", "live")];
    assert.equal(isPhaseComplete("group", matches), false);
  });

  it("ignores matches from other stages", () => {
    const matches = [
      match("group", "finished"),
      match("group", "finished"),
      match("R32", "scheduled")
    ];
    assert.equal(isPhaseComplete("group", matches), true);
  });
});

describe("computeStageCompletion", () => {
  it("returns empty map when input is empty", () => {
    assert.deepEqual(computeStageCompletion([]), {});
  });

  it("marks a stage true only when every match is finished", () => {
    const matches = [
      match("group", "finished"),
      match("group", "finished"),
      match("R32", "finished"),
      match("R32", "scheduled"),
      match("R16", "scheduled")
    ];
    const result = computeStageCompletion(matches);
    assert.equal(result.group, true);
    assert.equal(result.R32, false);
    assert.equal(result.R16, false);
  });

  it("does not include stages that have no matches in the input", () => {
    const matches = [match("group", "finished"), match("group", "finished")];
    const result = computeStageCompletion(matches);
    assert.equal(result.group, true);
    assert.equal(result.R32, undefined);
    assert.equal(result.FINAL, undefined);
  });
});
