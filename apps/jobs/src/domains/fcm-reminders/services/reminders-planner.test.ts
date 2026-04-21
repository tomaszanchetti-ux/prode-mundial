import assert from "node:assert/strict";
import test from "node:test";
import type { ReminderStoredMatch, ReminderStoredPrediction, ReminderStoredToken } from "../types";
import {
  buildReminderCopy,
  buildUserReminderPlans,
  filterMatchesInWindow,
  resolveReminderWindow
} from "./reminders-planner";

function buildMatch(overrides: Partial<ReminderStoredMatch> = {}): ReminderStoredMatch {
  return {
    matchId: "m_001",
    kickoffAt: "2026-06-11T19:00:00Z",
    stage: "group",
    ...overrides
  };
}

function buildPrediction(overrides: Partial<ReminderStoredPrediction> = {}): ReminderStoredPrediction {
  return {
    predictionId: "pred_u1_m001",
    userId: "u1",
    matchId: "m_001",
    isLocked: false,
    ...overrides
  };
}

function buildToken(overrides: Partial<ReminderStoredToken> = {}): ReminderStoredToken {
  return {
    userId: "u1",
    tokenId: "tok_1",
    token: "fcm-token-u1-a",
    ...overrides
  };
}

test("resolveReminderWindow returns start/end offset by hours from now", () => {
  const now = new Date("2026-06-10T10:00:00Z");
  const window = resolveReminderWindow(now, 20, 28);
  assert.equal(window.startIso, "2026-06-11T06:00:00.000Z");
  assert.equal(window.endIso, "2026-06-11T14:00:00.000Z");
});

test("resolveReminderWindow throws when endHours <= startHours", () => {
  assert.throws(() => resolveReminderWindow(new Date(), 24, 24));
  assert.throws(() => resolveReminderWindow(new Date(), 24, 20));
});

test("filterMatchesInWindow keeps matches inside [start, end)", () => {
  const window = { startIso: "2026-06-11T06:00:00.000Z", endIso: "2026-06-11T14:00:00.000Z" };
  const matches = [
    buildMatch({ matchId: "m_before", kickoffAt: "2026-06-11T05:00:00Z" }),
    buildMatch({ matchId: "m_at_start", kickoffAt: "2026-06-11T06:00:00.000Z" }),
    buildMatch({ matchId: "m_mid", kickoffAt: "2026-06-11T10:00:00Z" }),
    buildMatch({ matchId: "m_at_end", kickoffAt: "2026-06-11T14:00:00.000Z" }),
    buildMatch({ matchId: "m_after", kickoffAt: "2026-06-11T15:00:00Z" })
  ];

  const filtered = filterMatchesInWindow(matches, window);
  assert.deepEqual(
    filtered.map((m) => m.matchId),
    ["m_at_start", "m_mid"]
  );
});

test("buildUserReminderPlans emits plan per user with pending matches", () => {
  const matches = [
    buildMatch({ matchId: "m_001" }),
    buildMatch({ matchId: "m_002" }),
    buildMatch({ matchId: "m_003" })
  ];

  const predictions = [
    buildPrediction({ userId: "u1", matchId: "m_001" }),
    buildPrediction({ userId: "u2", matchId: "m_001" }),
    buildPrediction({ userId: "u2", matchId: "m_002" }),
    buildPrediction({ userId: "u2", matchId: "m_003" })
  ];

  const tokens = [
    buildToken({ userId: "u1", tokenId: "t_u1_a", token: "tok-u1-a" }),
    buildToken({ userId: "u1", tokenId: "t_u1_b", token: "tok-u1-b" }),
    buildToken({ userId: "u2", tokenId: "t_u2_a", token: "tok-u2-a" }),
    buildToken({ userId: "u3", tokenId: "t_u3_a", token: "tok-u3-a" })
  ];

  const plans = buildUserReminderPlans(matches, predictions, tokens);
  const byUser = new Map(plans.map((plan) => [plan.userId, plan]));

  // u1: predicción sólo de m_001 → pending m_002 + m_003 = 2, con 2 tokens
  assert.equal(byUser.get("u1")?.pendingMatchCount, 2);
  assert.equal(byUser.get("u1")?.tokens.length, 2);

  // u2: todas las 3 predicciones → sin plan
  assert.equal(byUser.get("u2"), undefined);

  // u3: sin predicciones → pending 3
  assert.equal(byUser.get("u3")?.pendingMatchCount, 3);
  assert.equal(byUser.get("u3")?.tokens.length, 1);
});

test("buildUserReminderPlans returns empty when no matches", () => {
  const plans = buildUserReminderPlans([], [], [buildToken()]);
  assert.deepEqual(plans, []);
});

test("buildUserReminderPlans returns empty when no tokens", () => {
  const plans = buildUserReminderPlans([buildMatch()], [], []);
  assert.deepEqual(plans, []);
});

test("buildReminderCopy uses singular for 1 pending, plural otherwise", () => {
  assert.match(buildReminderCopy(1).body, /1 predicción/);
  assert.match(buildReminderCopy(3).body, /3 predicciones/);
});
