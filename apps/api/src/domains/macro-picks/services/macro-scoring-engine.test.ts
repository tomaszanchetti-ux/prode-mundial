import assert from "node:assert/strict";
import test from "node:test";
import type { StoredChampionPick } from "../types";
import { scoreChampionPick } from "./macro-scoring-engine";

function buildPick(overrides: Partial<StoredChampionPick> = {}): StoredChampionPick {
  return {
    userId: "usr_1",
    championTeamId: "ARG",
    adjustedChampionTeamId: null,
    isLocked: true,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T19:00:00Z",
    adjustedAt: null,
    ...overrides
  };
}

test("scoreChampionPick awards 25 points for correct original pick", () => {
  const result = scoreChampionPick(buildPick(), "ARG");

  assert.deepEqual(result, { championPoints: 25, wasAdjusted: false });
});

test("scoreChampionPick awards 0 points for incorrect original pick", () => {
  const result = scoreChampionPick(buildPick(), "BRA");

  assert.deepEqual(result, { championPoints: 0, wasAdjusted: false });
});

test("scoreChampionPick awards 10 points for correct adjusted pick", () => {
  const result = scoreChampionPick(
    buildPick({ isAdjusted: true, adjustedChampionTeamId: "ESP" }),
    "ESP"
  );

  assert.deepEqual(result, { championPoints: 10, wasAdjusted: true });
});

test("scoreChampionPick awards 0 points for incorrect adjusted pick", () => {
  const result = scoreChampionPick(
    buildPick({ isAdjusted: true, adjustedChampionTeamId: "ESP" }),
    "ARG"
  );

  assert.deepEqual(result, { championPoints: 0, wasAdjusted: true });
});
