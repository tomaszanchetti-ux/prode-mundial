import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

import type { StoredMatch } from "../../matches/types";
import type { StoredBestPlayerPick } from "../types";
import type {
  TournamentProjectionBracket,
  TournamentProjectionMatch,
  TournamentProjectionResponse,
  TournamentProjectionSide
} from "@prode/shared";

const [
  { bestPlayerPickService },
  { matchesRepository },
  { bestPlayerPicksRepository },
  { tuMundialService }
] = await Promise.all([
  import("./best-player-service"),
  import("../../matches/repositories/matches-repository"),
  import("../repositories/best-player-picks-repository"),
  import("../../tournament/services/tu-mundial-service")
]);

// ── Fixtures ────────────────────────────────────────────

function buildMatch(overrides: Partial<StoredMatch>): StoredMatch {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeamId: "ARG",
    awayTeamId: "MEX",
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "scheduled",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: false,
    isScored: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides
  };
}

function buildStoredBestPlayer(overrides: Partial<StoredBestPlayerPick> = {}): StoredBestPlayerPick {
  return {
    userId: "usr_1",
    bestPlayerId: "ply-messi",
    adjustedBestPlayerId: null,
    isLocked: true,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T18:00:00Z",
    adjustedAt: null,
    ...overrides
  };
}

function side(team: string | null, slotLabel: string): TournamentProjectionSide {
  return {
    team: team
      ? { teamId: team, name: team, fifaCode: team, iso2: null, iso3: null, flagAsset: null, flagUrl: null }
      : null,
    slot: slotLabel,
    slotLabel
  };
}

function buildMatchNode(
  matchId: string,
  officialMatchNumber: number,
  stage: TournamentProjectionMatch["stage"],
  homeSlot: string,
  awaySlot: string,
  teams: [string | null, string | null] = [null, null]
): TournamentProjectionMatch {
  return {
    matchId,
    officialMatchNumber,
    stage,
    kickoffAt: "2026-06-30T19:00:00Z",
    kickoffAtEt: null,
    venueId: null,
    home: side(teams[0], homeSlot),
    away: side(teams[1], awaySlot),
    winnerTeamId: null,
    source: "projected"
  };
}

function buildBracket(
  teamsByR32Number: Record<number, [string | null, string | null]> = {}
): TournamentProjectionBracket {
  const r32 = Array.from({ length: 16 }, (_, i) => {
    const num = 73 + i;
    return buildMatchNode(
      `r32_${num}`,
      num,
      "R32",
      `S${num}h`,
      `S${num}a`,
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

function buildProjection(
  teamsByR32Number: Record<number, [string | null, string | null]> = {}
): TournamentProjectionResponse {
  return {
    mode: "pre_tournament",
    groups: [],
    bracket: buildBracket(teamsByR32Number),
    readiness: {
      groupMatchesTotal: 0,
      groupMatchesWithPrediction: 0,
      isGroupsComplete: false,
      unresolvedSlots: []
    },
    phaseUnlocks: {
      groups: true,
      r32: false,
      r16: false,
      qf: false,
      sf: false,
      bronzeFinal: false
    },
    updatedAt: "2026-01-01T00:00:00Z"
  };
}

// ── Tests ───────────────────────────────────────────────

test("getForUser returns 'empty' when user has no stored best-player", async () => {
  const getMock = mock.method(bestPlayerPicksRepository, "getByUserId", async () => null);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    const result = await bestPlayerPickService.getForUser("usr_1", new Date("2026-06-10T18:00:00Z"));
    assert.equal(result.status, "empty");
    assert.equal(result.pickWindow, "A");
    assert.equal(result.pickWindowPointValue, 20);
    assert.equal(result.bestPlayerId, null);
  } finally {
    getMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("saveForUser throws BEST_PLAYER_INVALID when playerId is not in roster", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        bestPlayerPickService.saveForUser(
          "usr_1",
          { bestPlayerId: "ply-not-a-real-player" },
          new Date("2026-06-10T18:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string; statusCode?: number };
        assert.equal(apiErr.code, "BEST_PLAYER_INVALID");
        assert.equal(apiErr.statusCode, 409);
        return true;
      }
    );
  } finally {
    listMatchesMock.mock.restore();
  }
});

test("saveForUser persists the pick with a valid roster playerId during window A", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const getMock = mock.method(bestPlayerPicksRepository, "getByUserId", async () => null);
  const upsertMock = mock.method(bestPlayerPicksRepository, "upsert", async () => undefined);

  try {
    const result = await bestPlayerPickService.saveForUser(
      "usr_1",
      { bestPlayerId: "ply-mbappe" },
      new Date("2026-06-10T18:00:00Z")
    );
    assert.equal(result.ok, true);
    assert.equal(result.status, "picked");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    listMatchesMock.mock.restore();
    getMock.mock.restore();
    upsertMock.mock.restore();
  }
});

test("saveForUser throws BEST_PLAYER_PICK_LOCKED once window A has closed", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        bestPlayerPickService.saveForUser(
          "usr_1",
          { bestPlayerId: "ply-messi" },
          new Date("2026-06-11T18:30:00Z") // 30min before kickoff → window A closed
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "BEST_PLAYER_PICK_LOCKED");
        return true;
      }
    );
  } finally {
    listMatchesMock.mock.restore();
  }
});

test("adjustForUser throws BEST_PLAYER_PICK_NOT_FOUND when no pick exists", async () => {
  const getMock = mock.method(bestPlayerPicksRepository, "getByUserId", async () => null);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        bestPlayerPickService.adjustForUser(
          "usr_1",
          { bestPlayerId: "ply-messi" },
          new Date("2026-06-27T12:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "BEST_PLAYER_PICK_NOT_FOUND");
        return true;
      }
    );
  } finally {
    getMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("adjustForUser throws BEST_PLAYER_TEAM_ELIMINATED when player's team is not alive", async () => {
  // Messi → ARG. Bracket has only MEX alive → ARG eliminated.
  const existing = buildStoredBestPlayer({ bestPlayerId: "ply-mbappe" });
  const getMock = mock.method(bestPlayerPicksRepository, "getByUserId", async () => existing);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["MEX", null], 85: ["BRA", null] })
  );

  try {
    await assert.rejects(
      () =>
        bestPlayerPickService.adjustForUser(
          "usr_1",
          { bestPlayerId: "ply-messi" }, // ARG not in alive set
          new Date("2026-06-27T12:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "BEST_PLAYER_TEAM_ELIMINATED");
        return true;
      }
    );
  } finally {
    getMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
  }
});

test("adjustForUser persists the adjustment when player's team is alive", async () => {
  const existing = buildStoredBestPlayer({ bestPlayerId: "ply-mbappe" });
  const getMock = mock.method(bestPlayerPicksRepository, "getByUserId", async () => existing);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["ARG", null], 85: ["BRA", null] })
  );
  const upsertMock = mock.method(bestPlayerPicksRepository, "upsert", async () => undefined);

  try {
    const result = await bestPlayerPickService.adjustForUser(
      "usr_1",
      { bestPlayerId: "ply-messi" }, // ARG is alive
      new Date("2026-06-27T12:00:00Z")
    );
    assert.equal(result.ok, true);
    assert.equal(result.status, "adjusted");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    getMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
    upsertMock.mock.restore();
  }
});
