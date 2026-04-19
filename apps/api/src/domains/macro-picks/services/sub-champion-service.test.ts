import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

import type { StoredMatch } from "../../matches/types";
import type { StoredChampionPick, StoredSubChampionPick } from "../types";
import type {
  TournamentProjectionBracket,
  TournamentProjectionMatch,
  TournamentProjectionResponse,
  TournamentProjectionSide
} from "@prode/shared";

const [
  { subChampionPickService },
  { matchesRepository },
  { championPicksRepository },
  { subChampionPicksRepository },
  { tuMundialService }
] = await Promise.all([
  import("./sub-champion-service"),
  import("../../matches/repositories/matches-repository"),
  import("../repositories/macro-picks-repository"),
  import("../repositories/sub-champion-picks-repository"),
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

function buildStoredChampion(overrides: Partial<StoredChampionPick> = {}): StoredChampionPick {
  return {
    userId: "usr_1",
    championTeamId: "ARG",
    adjustedChampionTeamId: null,
    isLocked: false,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: null,
    adjustedAt: null,
    ...overrides
  };
}

function buildStoredSub(overrides: Partial<StoredSubChampionPick> = {}): StoredSubChampionPick {
  return {
    userId: "usr_1",
    subChampionTeamId: "BRA",
    adjustedSubChampionTeamId: null,
    isLocked: true,
    isAdjusted: false,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    lockedAt: "2026-06-11T18:00:00Z",
    adjustedAt: null,
    ...overrides
  };
}

// Minimal FIFA 2026-shaped bracket. Team assignments are controlled via
// `teamsByR32Number`; default is no teams assigned (unresolved halves).
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
  const r16 = Array.from({ length: 8 }, (_, i) => {
    const num = 89 + i;
    return buildMatchNode(`r16_${num}`, num, "R16", `W(M${73 + i * 2})`, `W(M${74 + i * 2})`);
  });
  const qf = Array.from({ length: 4 }, (_, i) => {
    const num = 97 + i;
    return buildMatchNode(`qf_${num}`, num, "QF", `W(M${89 + i * 2})`, `W(M${90 + i * 2})`);
  });
  const sf = [
    buildMatchNode("sf_101", 101, "SF", "W(M97)", "W(M98)"),
    buildMatchNode("sf_102", 102, "SF", "W(M99)", "W(M100)")
  ];
  return {
    round32: r32,
    round16: r16,
    quarterfinals: qf,
    semifinals: sf,
    bronze: [buildMatchNode("bronze_103", 103, "BRONZE", "L(M101)", "L(M102)")],
    final: [buildMatchNode("final_104", 104, "FINAL", "W(M101)", "W(M102)")]
  };
}

function buildProjection(
  teamsByR32Number: Record<number, [string | null, string | null]> = {}
): TournamentProjectionResponse {
  return {
    mode: "predictions",
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

test("getForUser returns 'empty' when user has no stored sub-champion", async () => {
  const subMock = mock.method(subChampionPicksRepository, "getByUserId", async () => null);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    const result = await subChampionPickService.getForUser("usr_1", new Date("2026-06-10T18:00:00Z"));
    assert.equal(result.status, "empty");
    assert.equal(result.pickWindow, "A");
    assert.equal(result.pickWindowPointValue, 25);
  } finally {
    subMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("saveForUser throws SUB_CHAMPION_REQUIRES_CHAMPION when no champion is picked", async () => {
  const champMock = mock.method(championPicksRepository, "getByUserId", async () => null);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        subChampionPickService.saveForUser(
          "usr_1",
          { subChampionTeamId: "BRA" },
          new Date("2026-06-10T18:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string; statusCode?: number };
        assert.equal(apiErr.code, "SUB_CHAMPION_REQUIRES_CHAMPION");
        assert.equal(apiErr.statusCode, 409);
        return true;
      }
    );
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("saveForUser throws SUB_CHAMPION_SAME_TEAM when sub-champion equals champion", async () => {
  const champMock = mock.method(championPicksRepository, "getByUserId", async () =>
    buildStoredChampion({ championTeamId: "ARG" })
  );
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["ARG", null], 85: ["BRA", null] })
  );

  try {
    await assert.rejects(
      () =>
        subChampionPickService.saveForUser(
          "usr_1",
          { subChampionTeamId: "ARG" },
          new Date("2026-06-10T18:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "SUB_CHAMPION_SAME_TEAM");
        return true;
      }
    );
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
  }
});

test("saveForUser throws SUB_CHAMPION_SAME_HALF when both teams share a half", async () => {
  const champMock = mock.method(championPicksRepository, "getByUserId", async () =>
    buildStoredChampion({ championTeamId: "ARG" })
  );
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  // ARG at R32 73 (half A), MEX at R32 77 (also half A — 73..80 all A).
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["ARG", null], 77: ["MEX", null] })
  );

  try {
    await assert.rejects(
      () =>
        subChampionPickService.saveForUser(
          "usr_1",
          { subChampionTeamId: "MEX" },
          new Date("2026-06-10T18:00:00Z")
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "SUB_CHAMPION_SAME_HALF");
        return true;
      }
    );
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
  }
});

test("saveForUser persists the pick when teams are in opposite halves", async () => {
  const champMock = mock.method(championPicksRepository, "getByUserId", async () =>
    buildStoredChampion({ championTeamId: "ARG" })
  );
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  // ARG in A (r32_73), BRA in B (r32_85).
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["ARG", null], 85: ["BRA", null] })
  );
  const subGetMock = mock.method(subChampionPicksRepository, "getByUserId", async () => null);
  const upsertMock = mock.method(subChampionPicksRepository, "upsert", async () => undefined);

  try {
    const result = await subChampionPickService.saveForUser(
      "usr_1",
      { subChampionTeamId: "BRA" },
      new Date("2026-06-10T18:00:00Z")
    );
    assert.equal(result.ok, true);
    assert.equal(result.status, "picked");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
    subGetMock.mock.restore();
    upsertMock.mock.restore();
  }
});

test("saveForUser throws SUB_CHAMPION_PICK_LOCKED once window A has closed", async () => {
  const champMock = mock.method(championPicksRepository, "getByUserId", async () =>
    buildStoredChampion({ championTeamId: "ARG" })
  );
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        subChampionPickService.saveForUser(
          "usr_1",
          { subChampionTeamId: "BRA" },
          new Date("2026-06-11T18:30:00Z") // 30min before kickoff → window A closed
        ),
      (err: unknown) => {
        const apiErr = err as { code?: string };
        assert.equal(apiErr.code, "SUB_CHAMPION_PICK_LOCKED");
        return true;
      }
    );
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("adjustForUser persists the adjustment during window B", async () => {
  const existingSub = buildStoredSub({ subChampionTeamId: "BRA" });
  const champMock = mock.method(championPicksRepository, "getByUserId", async () =>
    buildStoredChampion({ championTeamId: "ARG" })
  );
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_073", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z", status: "scheduled" })
  ]);
  const projectionMock = mock.method(tuMundialService, "getTournamentProjectionForUser", async () =>
    buildProjection({ 73: ["ARG", null], 85: ["URU", null] })
  );
  const subGetMock = mock.method(subChampionPicksRepository, "getByUserId", async () => existingSub);
  const upsertMock = mock.method(subChampionPicksRepository, "upsert", async () => undefined);

  try {
    const result = await subChampionPickService.adjustForUser(
      "usr_1",
      { subChampionTeamId: "URU" },
      new Date("2026-06-27T12:00:00Z")
    );
    assert.equal(result.ok, true);
    assert.equal(result.status, "adjusted");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    champMock.mock.restore();
    listMatchesMock.mock.restore();
    projectionMock.mock.restore();
    subGetMock.mock.restore();
    upsertMock.mock.restore();
  }
});
