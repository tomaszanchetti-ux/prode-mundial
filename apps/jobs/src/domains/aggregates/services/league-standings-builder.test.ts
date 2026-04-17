import assert from "node:assert/strict";
import test from "node:test";
import { buildLeagueStandingRows } from "./league-standings-builder";
import type { AggregatesLeagueMember } from "../types";

const NOW = "2026-04-17T12:00:00Z";

function buildMember(overrides: Partial<AggregatesLeagueMember> = {}): AggregatesLeagueMember {
  return {
    membershipId: "mem_001",
    leagueId: "league_A",
    userId: "user_1",
    role: "member",
    joinedAt: "2026-01-01T00:00:00Z",
    ...overrides
  };
}

test("buildLeagueStandingRows: sorts by totalPoints desc and assigns position", () => {
  const memberships = [
    buildMember({ membershipId: "m1", userId: "u1" }),
    buildMember({ membershipId: "m2", userId: "u2" }),
    buildMember({ membershipId: "m3", userId: "u3" })
  ];
  const profiles = [
    { userId: "u1", displayName: "Ana", totalPoints: 10, macroPoints: 0, exactHits: 1, correctSigns: 2 },
    { userId: "u2", displayName: "Beto", totalPoints: 25, macroPoints: 10, exactHits: 2, correctSigns: 3 },
    { userId: "u3", displayName: "Caro", totalPoints: 15, macroPoints: 0, exactHits: 1, correctSigns: 3 }
  ];

  const rows = buildLeagueStandingRows("league_A", memberships, profiles, NOW);

  assert.equal(rows[0].userId, "u2");
  assert.equal(rows[0].position, 1);
  assert.equal(rows[1].userId, "u3");
  assert.equal(rows[1].position, 2);
  assert.equal(rows[2].userId, "u1");
  assert.equal(rows[2].position, 3);
});

test("buildLeagueStandingRows: tiebreaker uses exactHits then correctSigns then macro then name", () => {
  const memberships = [
    buildMember({ membershipId: "m1", userId: "u1" }),
    buildMember({ membershipId: "m2", userId: "u2" })
  ];
  const profiles = [
    { userId: "u1", displayName: "Zoe", totalPoints: 10, macroPoints: 0, exactHits: 1, correctSigns: 2 },
    { userId: "u2", displayName: "Ana", totalPoints: 10, macroPoints: 0, exactHits: 2, correctSigns: 1 }
  ];

  const rows = buildLeagueStandingRows("league_A", memberships, profiles, NOW);

  assert.equal(rows[0].userId, "u2", "u2 wins on exactHits");
  assert.equal(rows[1].userId, "u1");
});

test("buildLeagueStandingRows: falls back to zeros when profile missing", () => {
  const memberships = [buildMember({ userId: "ghost" })];
  const profiles: Array<{ userId: string; displayName: string }> = [];

  const rows = buildLeagueStandingRows("league_A", memberships, profiles, NOW);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, "ghost");
  assert.equal(rows[0].displayName, "ghost");
  assert.equal(rows[0].totalPoints, 0);
  assert.equal(rows[0].position, 1);
});

test("buildLeagueStandingRows: marks owner correctly", () => {
  const memberships = [
    buildMember({ membershipId: "m1", userId: "u1", role: "owner" }),
    buildMember({ membershipId: "m2", userId: "u2", role: "member" })
  ];
  const profiles = [
    { userId: "u1", displayName: "Owner", totalPoints: 5, macroPoints: 0, exactHits: 0, correctSigns: 0 },
    { userId: "u2", displayName: "Member", totalPoints: 10, macroPoints: 0, exactHits: 0, correctSigns: 0 }
  ];

  const rows = buildLeagueStandingRows("league_A", memberships, profiles, NOW);

  const owner = rows.find((row) => row.userId === "u1");
  const member = rows.find((row) => row.userId === "u2");
  assert.equal(owner?.isOwner, true);
  assert.equal(member?.isOwner, false);
});

test("buildLeagueStandingRows: sets lastUpdatedAt to nowIso", () => {
  const memberships = [buildMember({ userId: "u1" })];
  const profiles = [
    { userId: "u1", displayName: "Ana", totalPoints: 0, macroPoints: 0, exactHits: 0, correctSigns: 0 }
  ];

  const rows = buildLeagueStandingRows("league_A", memberships, profiles, NOW);
  assert.equal(rows[0].lastUpdatedAt, NOW);
});
