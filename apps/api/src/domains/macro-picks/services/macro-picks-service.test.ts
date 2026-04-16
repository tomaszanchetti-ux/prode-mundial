import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

import type { StoredMatch } from "../../matches/types";
import type { StoredChampionPick } from "../types";

const [{ championPickService }, { matchesRepository }, { championPicksRepository }, { championScoringLogsRepository }] = await Promise.all([
  import("./macro-picks-service"),
  import("../../matches/repositories/matches-repository"),
  import("../repositories/macro-picks-repository"),
  import("../repositories/macro-scoring-logs-repository")
]);

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

function buildStoredPick(overrides: Partial<StoredChampionPick> = {}): StoredChampionPick {
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

test("getForUser returns empty before tournament kickoff when the user has no saved pick", async () => {
  const getByUserIdMock = mock.method(championPicksRepository, "getByUserId", async () => null);
  const scoringLogsMock = mock.method(championScoringLogsRepository, "listByUserId", async () => []);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_064", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    const result = await championPickService.getForUser("usr_1", new Date("2026-06-10T18:00:00Z"));

    assert.equal(result.status, "empty");
    assert.equal(result.isLocked, false);
    assert.equal(result.championTeamId, null);
  } finally {
    getByUserIdMock.mock.restore();
    scoringLogsMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("getForUser returns scored when a scoring log already exists", async () => {
  const getByUserIdMock = mock.method(championPicksRepository, "getByUserId", async () => buildStoredPick());
  const scoringLogsMock = mock.method(championScoringLogsRepository, "listByUserId", async () => [
    {
      userId: "usr_1",
      tournamentId: "wc2026",
      totalPoints: 25,
      championPoints: 25,
      wasAdjusted: false,
      scoredAt: "2026-07-20T00:00:00Z"
    }
  ]);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_049", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z", status: "finished" })
  ]);

  try {
    const result = await championPickService.getForUser("usr_1", new Date("2026-07-21T12:00:00Z"));

    assert.equal(result.status, "scored");
    assert.equal(result.isLocked, true);
    assert.deepEqual(result.scoringResult, { points: 25, wasAdjusted: false });
  } finally {
    getByUserIdMock.mock.restore();
    scoringLogsMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("saveForUser stores champion pick before kickoff", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_064", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const getByUserIdMock = mock.method(championPicksRepository, "getByUserId", async () => null);
  const upsertMock = mock.method(championPicksRepository, "upsert", async () => undefined);

  try {
    const result = await championPickService.saveForUser(
      "usr_1",
      { championTeamId: "ARG" },
      new Date("2026-06-10T18:00:00Z")
    );

    assert.equal(result.ok, true);
    assert.equal(result.status, "picked");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    listMatchesMock.mock.restore();
    getByUserIdMock.mock.restore();
    upsertMock.mock.restore();
  }
});

test("adjustForUser persists the adjustment during the knockout window", async () => {
  const existing = buildStoredPick();
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_049", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z", status: "scheduled" })
  ]);
  const getByUserIdMock = mock.method(championPicksRepository, "getByUserId", async () => existing);
  const upsertMock = mock.method(championPicksRepository, "upsert", async () => undefined);

  try {
    const result = await championPickService.adjustForUser(
      "usr_1",
      { championTeamId: "ESP" },
      new Date("2026-06-27T12:00:00Z")
    );

    assert.equal(result.ok, true);
    assert.equal(result.status, "adjusted");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    listMatchesMock.mock.restore();
    getByUserIdMock.mock.restore();
    upsertMock.mock.restore();
  }
});
