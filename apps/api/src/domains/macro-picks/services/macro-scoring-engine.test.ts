import assert from "node:assert/strict";
import test from "node:test";
import type { MacroGroupId } from "@prode/shared";
import type { StoredMacroPrediction } from "../types";
import { applyAdjustmentPenalty, computeMacroScore, scoreChampion, scoreFinalists, scoreGroupPicks, type MacroTournamentResults } from "./macro-scoring-engine";

function buildPrediction(overrides: Partial<StoredMacroPrediction> = {}): StoredMacroPrediction {
  return {
    userId: "usr_1",
    groupPicks: {
      A: { firstTeamId: "ARG", secondTeamId: "MEX" },
      B: { firstTeamId: "BRA", secondTeamId: "ESP" }
    },
    finalists: ["ARG", "BRA"],
    champion: "ARG",
    isLocked: true,
    isSubmitted: true,
    isAdjusted: false,
    adjustedAt: null,
    adjustedFinalists: null,
    adjustedChampion: null,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T19:00:00Z",
    ...overrides
  };
}

function buildResults(overrides: Partial<MacroTournamentResults> = {}): MacroTournamentResults {
  return {
    groups: {
      A: { firstTeamId: "ARG", secondTeamId: "MEX" },
      B: { firstTeamId: "ESP", secondTeamId: "BRA" }
    } as Record<MacroGroupId, { firstTeamId: string; secondTeamId: string }>,
    finalists: ["ARG", "BRA"],
    champion: "ARG",
    ...overrides
  };
}

test("scoreGroupPicks awards points per slot, including inverted qualified teams", () => {
  const points = scoreGroupPicks(buildPrediction().groupPicks, buildResults().groups);

  assert.equal(points, 30);
});

test("scoreFinalists awards points per correct finalist", () => {
  assert.equal(scoreFinalists(["ARG", "ESP"], ["ARG", "BRA"], false), 10);
  assert.equal(scoreFinalists(["ARG", "ESP"], ["ARG", "BRA"], true), 5);
});

test("scoreChampion applies adjusted and regular champion values", () => {
  assert.equal(scoreChampion("ARG", "ARG", false), 25);
  assert.equal(scoreChampion("ARG", "ARG", true), 12);
  assert.equal(scoreChampion("BRA", "ARG", false), 0);
});

test("applyAdjustmentPenalty composes final total without mutating the category scores", () => {
  const result = applyAdjustmentPenalty(buildPrediction({ isAdjusted: true }), {
    groupPoints: 30,
    finalistsPoints: 10,
    championPoints: 12
  });

  assert.deepEqual(result, {
    groupPoints: 30,
    finalistsPoints: 10,
    championPoints: 12,
    adjustmentPenaltyApplied: true,
    totalPoints: 52
  });
});

test("computeMacroScore uses adjusted picks and penalty scoring when present", () => {
  const result = computeMacroScore(
    buildPrediction({
      isAdjusted: true,
      adjustedFinalists: ["ARG", "ESP"],
      adjustedChampion: "ARG"
    }),
    buildResults()
  );

  assert.deepEqual(result, {
    groupPoints: 30,
    finalistsPoints: 5,
    championPoints: 12,
    adjustmentPenaltyApplied: true,
    totalPoints: 47
  });
});
