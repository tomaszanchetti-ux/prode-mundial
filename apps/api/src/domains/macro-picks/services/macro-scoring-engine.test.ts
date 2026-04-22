import assert from "node:assert/strict";
import test from "node:test";
import type { StoredBestPlayerPick, StoredChampionPick, StoredSubChampionPick } from "../types";
import { scoreBestPlayerPick, scoreChampionPick, scoreSubChampionPick } from "./macro-scoring-engine";

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

function buildSubPick(overrides: Partial<StoredSubChampionPick> = {}): StoredSubChampionPick {
  return {
    userId: "usr_1",
    subChampionTeamId: "BRA",
    adjustedSubChampionTeamId: null,
    isLocked: true,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T19:00:00Z",
    adjustedAt: null,
    ...overrides
  };
}

function buildBestPlayerPick(overrides: Partial<StoredBestPlayerPick> = {}): StoredBestPlayerPick {
  return {
    userId: "usr_1",
    bestPlayerId: "ply-messi",
    adjustedBestPlayerId: null,
    isLocked: true,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T19:00:00Z",
    adjustedAt: null,
    ...overrides
  };
}

test("scoreChampionPick awards 20 points for correct original pick", () => {
  const result = scoreChampionPick(buildPick(), "ARG");

  assert.deepEqual(result, { championPoints: 20, wasAdjusted: false });
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

test("scoreSubChampionPick awards 20 points for correct original pick", () => {
  const result = scoreSubChampionPick(buildSubPick(), "BRA");
  assert.deepEqual(result, { subChampionPoints: 20, wasAdjusted: false });
});

test("scoreSubChampionPick awards 10 points for correct adjusted pick", () => {
  const result = scoreSubChampionPick(
    buildSubPick({ isAdjusted: true, adjustedSubChampionTeamId: "FRA" }),
    "FRA"
  );
  assert.deepEqual(result, { subChampionPoints: 10, wasAdjusted: true });
});

test("scoreSubChampionPick awards 0 points for incorrect pick", () => {
  const result = scoreSubChampionPick(buildSubPick(), "ESP");
  assert.deepEqual(result, { subChampionPoints: 0, wasAdjusted: false });
});

test("scoreBestPlayerPick awards 20 points for correct original pick", () => {
  const result = scoreBestPlayerPick(buildBestPlayerPick(), "ply-messi");
  assert.deepEqual(result, { bestPlayerPoints: 20, wasAdjusted: false });
});

test("scoreBestPlayerPick awards 10 points for correct adjusted pick", () => {
  const result = scoreBestPlayerPick(
    buildBestPlayerPick({ isAdjusted: true, adjustedBestPlayerId: "ply-mbappe" }),
    "ply-mbappe"
  );
  assert.deepEqual(result, { bestPlayerPoints: 10, wasAdjusted: true });
});

test("scoreBestPlayerPick awards 0 points for incorrect pick", () => {
  const result = scoreBestPlayerPick(buildBestPlayerPick(), "ply-mbappe");
  assert.deepEqual(result, { bestPlayerPoints: 0, wasAdjusted: false });
});
