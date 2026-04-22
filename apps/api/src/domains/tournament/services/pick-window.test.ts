import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  PICK_WINDOW_POINT_VALUES,
  TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF,
  resolvePickWindow
} from "@prode/shared";

const INAUGURAL = "2026-06-11T19:00:00.000Z";
const FIRST_KO = "2026-06-30T19:00:00.000Z"; // R32 in FIFA 2026 (first knock-out match)

const MINUTE_MS = 60_000;

function at(iso: string, offsetMinutes: number): Date {
  return new Date(new Date(iso).getTime() + offsetMinutes * MINUTE_MS);
}

describe("resolvePickWindow", () => {
  it("returns 'closed' when no inaugural kickoff is scheduled", () => {
    const result = resolvePickWindow({
      now: new Date("2026-06-01T00:00:00.000Z"),
      inauguralKickoffAt: null,
      firstKnockoutKickoffAt: null,
      areGroupsOfficiallyClosed: false
    });
    assert.equal(result.window, "closed");
    assert.equal(result.closesAt, null);
    assert.equal(result.pointValue, 0);
  });

  it("returns window A with 20 pts well before the inaugural kickoff", () => {
    const result = resolvePickWindow({
      now: at(INAUGURAL, -10 * 24 * 60), // 10 days before
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: false
    });
    assert.equal(result.window, "A");
    assert.equal(result.pointValue, PICK_WINDOW_POINT_VALUES.A);
    assert.equal(result.pointValue, 20);
    // closesAt = inaugural - 1h
    assert.equal(
      result.closesAt,
      new Date(new Date(INAUGURAL).getTime() - TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF * MINUTE_MS).toISOString()
    );
  });

  it("keeps window A open until exactly 1h before the inaugural kickoff", () => {
    const result = resolvePickWindow({
      now: at(INAUGURAL, -TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF - 1), // 1h 1min before
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: false
    });
    assert.equal(result.window, "A");
  });

  it("closes window A at the exact 1h-before boundary (inclusive)", () => {
    const result = resolvePickWindow({
      now: at(INAUGURAL, -TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF), // exactly 1h before
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: false
    });
    assert.equal(result.window, "closed");
    assert.equal(result.pointValue, 0);
  });

  it("returns 'closed' during the groups stage (between A and B)", () => {
    const result = resolvePickWindow({
      now: at(INAUGURAL, 60 * 24 * 5), // 5 days into the tournament
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: false
    });
    assert.equal(result.window, "closed");
    assert.equal(result.closesAt, null);
    assert.equal(result.pointValue, 0);
  });

  it("opens window B once groups close officially and first knock-out is still >1h away", () => {
    const result = resolvePickWindow({
      now: at(FIRST_KO, -2 * 60), // 2h before first knock-out
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(result.window, "B");
    assert.equal(result.pointValue, PICK_WINDOW_POINT_VALUES.B);
    assert.equal(result.pointValue, 10);
    assert.equal(
      result.closesAt,
      new Date(new Date(FIRST_KO).getTime() - TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF * MINUTE_MS).toISOString()
    );
  });

  it("closes window B at the exact 1h-before first-knock-out boundary", () => {
    const result = resolvePickWindow({
      now: at(FIRST_KO, -TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF),
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(result.window, "closed");
  });

  it("stays 'closed' after the first knock-out kicks off (post-B)", () => {
    const result = resolvePickWindow({
      now: at(FIRST_KO, 30),
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(result.window, "closed");
    assert.equal(result.pointValue, 0);
  });

  it("stays 'closed' if groups closed but no knock-out kickoff is scheduled yet", () => {
    const result = resolvePickWindow({
      now: at(INAUGURAL, 60 * 24 * 20),
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(result.window, "closed");
    assert.equal(result.closesAt, null);
    assert.equal(result.pointValue, 0);
  });

  it("does NOT re-open A just because areGroupsOfficiallyClosed flips false before inaugural", () => {
    // Edge case: seed/backoffice state — bool says groups not closed but we're still
    // pre-inaugural. A should be open, no interference from the B gate.
    const result = resolvePickWindow({
      now: at(INAUGURAL, -2 * 60),
      inauguralKickoffAt: INAUGURAL,
      firstKnockoutKickoffAt: FIRST_KO,
      areGroupsOfficiallyClosed: true // impossible in practice but shouldn't break A
    });
    assert.equal(result.window, "A");
    assert.equal(result.pointValue, 20);
  });
});
