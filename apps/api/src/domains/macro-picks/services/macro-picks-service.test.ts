import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

import type { StoredMatch } from "../../matches/types";
import type { StoredMacroPrediction } from "../types";

const [{ macroPicksService }, { matchesRepository }, { macroPicksRepository }] = await Promise.all([
  import("./macro-picks-service"),
  import("../../matches/repositories/matches-repository"),
  import("../repositories/macro-picks-repository")
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

function buildStoredPrediction(overrides: Partial<StoredMacroPrediction> = {}): StoredMacroPrediction {
  return {
    userId: "usr_1",
    groupPicks: {
      A: { firstTeamId: "ARG", secondTeamId: "MEX" },
      B: { firstTeamId: "BRA", secondTeamId: "ESP" },
      C: { firstTeamId: "FRA", secondTeamId: "GER" },
      D: { firstTeamId: "POR", secondTeamId: "URU" },
      E: { firstTeamId: "ENG", secondTeamId: "NED" },
      F: { firstTeamId: "BEL", secondTeamId: "CRO" },
      G: { firstTeamId: "USA", secondTeamId: "JPN" },
      H: { firstTeamId: "MEX", secondTeamId: "SUI" },
      I: { firstTeamId: "ARG", secondTeamId: "COL" },
      J: { firstTeamId: "BRA", secondTeamId: "PAR" },
      K: { firstTeamId: "ESP", secondTeamId: "MAR" },
      L: { firstTeamId: "GER", secondTeamId: "DEN" }
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

test("getForUser returns not_started before tournament kickoff when the user has no saved picks", async () => {
  const getByUserIdMock = mock.method(macroPicksRepository, "getByUserId", async () => null);
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_064", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    const result = await macroPicksService.getForUser("usr_1", new Date("2026-06-10T18:00:00Z"));

    assert.equal(result.status, "not_started");
    assert.equal(result.isLocked, false);
    assert.equal(result.adjustmentAvailable, false);
    assert.deepEqual(result.groupPicks, {});
  } finally {
    getByUserIdMock.mock.restore();
    listMatchesMock.mock.restore();
  }
});

test("saveForUser stores draft state before kickoff when picks are still incomplete", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_064", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);
  const getByUserIdMock = mock.method(macroPicksRepository, "getByUserId", async () => null);
  const upsertMock = mock.method(macroPicksRepository, "upsert", async () => undefined);

  try {
    const result = await macroPicksService.saveForUser(
      "usr_1",
      {
        groupPicks: {
          A: { firstTeamId: "ARG", secondTeamId: "MEX" }
        },
        finalists: [],
        champion: null
      },
      new Date("2026-06-10T18:00:00Z")
    );

    assert.equal(result.status, "draft_editable");
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    listMatchesMock.mock.restore();
    getByUserIdMock.mock.restore();
    upsertMock.mock.restore();
  }
});

test("saveForUser rejects duplicated finalists with INVALID_FINALISTS_DUPLICATE", async () => {
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" }),
    buildMatch({ matchId: "m_064", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z" })
  ]);

  try {
    await assert.rejects(
      () =>
        macroPicksService.saveForUser(
          "usr_1",
          {
            groupPicks: {},
            finalists: ["ARG", "ARG"],
            champion: "ARG"
          },
          new Date("2026-06-10T18:00:00Z")
        ),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "INVALID_FINALISTS_DUPLICATE"
    );
  } finally {
    listMatchesMock.mock.restore();
  }
});

test("confirmAdjustmentForUser persists the adjustment during the knockout window", async () => {
  const existing = buildStoredPrediction();
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_048", kickoffAt: "2026-06-26T19:00:00Z", status: "finished" }),
    buildMatch({ matchId: "m_049", stage: "R32", groupId: null, kickoffAt: "2026-06-28T19:00:00Z", status: "scheduled" })
  ]);
  const getByUserIdMock = mock.method(macroPicksRepository, "getByUserId", async () => existing);
  const upsertMock = mock.method(macroPicksRepository, "upsert", async () => undefined);

  try {
    const result = await macroPicksService.confirmAdjustmentForUser(
      "usr_1",
      {
        finalists: ["ARG", "ESP"],
        champion: "ARG"
      },
      new Date("2026-06-27T12:00:00Z")
    );

    assert.equal(result.status, "adjusted_locked");
    assert.deepEqual(result.adjustedFinalists, ["ARG", "ESP"]);
    assert.equal(result.adjustedChampion, "ARG");
    assert.equal(result.penaltyModel.finalistPoints, 5);
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    listMatchesMock.mock.restore();
    getByUserIdMock.mock.restore();
    upsertMock.mock.restore();
  }
});
