import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, mock, test } from "node:test";
import { ApiError } from "../../../server/errors/api-error";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { matchesRepository }, { predictionsRepository }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../repositories/matches-repository"),
  import("../repositories/predictions-repository")
]);

const app = createApp();
const server = app.listen(0);

before(() => {
  server.unref();
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

function buildUrl(pathname: string) {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}${pathname}`;
}

test("PUT /api/v1/matches/:matchId/prediction saves editable prediction and returns envelope", async () => {
  const kickoffAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => []);
  const getMatchByIdMock = mock.method(matchesRepository, "getMatchById", async (matchId: string) => {
    assert.equal(matchId, "m_073");

    return {
      matchId: "m_073",
      stage: "R32",
      groupId: null,
      homeTeamId: "arg",
      awayTeamId: "ned",
      homeSlot: null,
      awaySlot: null,
      kickoffAt,
      status: "scheduled",
      homeScore90: null,
      awayScore90: null,
      winnerTeamId: null,
      isLocked: false,
      isScored: false,
      createdAt: "2026-04-09T00:00:00Z",
      updatedAt: "2026-04-09T00:00:00Z"
    };
  });
  const upsertPredictionMock = mock.method(
    predictionsRepository,
    "upsertPrediction",
    async (userId: string, matchId: string, input: { homeScorePred: number; awayScorePred: number; predictedQualifierTeamId: string | null }) => {
      assert.equal(userId, "usr_1");
      assert.equal(matchId, "m_073");
      assert.deepEqual(input, {
        homeScorePred: 1,
        awayScorePred: 1,
        predictedQualifierTeamId: "arg"
      });

      return {
        predictionId: "pred_usr_1_m_073",
        userId,
        matchId,
        homeScorePred: input.homeScorePred,
        awayScorePred: input.awayScorePred,
        predictedQualifierTeamId: input.predictedQualifierTeamId,
        predictedWinnerTeamId: null,
        isLocked: false,
        isScored: false,
        pointsAwarded: 0,
        scoringBreakdown: null,
        createdAt: "2026-04-09T10:00:00Z",
        updatedAt: "2026-04-09T10:05:00Z"
      };
    }
  );

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_073/prediction"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        homeScorePred: 1,
        awayScorePred: 1,
        predictedQualifierTeamId: "arg"
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        predictionId: string;
        matchId: string;
        status: string;
        isEditable: boolean;
        predictedQualifierTeamId: string | null;
        savedAt: string;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.deepEqual(payload.data, {
      predictionId: "pred_usr_1_m_073",
      matchId: "m_073",
      status: "saved_editable",
      isEditable: true,
      homeScorePred: 1,
      awayScorePred: 1,
      predictedQualifierTeamId: "arg",
      savedAt: "2026-04-09T10:05:00Z"
    });
  } finally {
    verifyIdTokenMock.mock.restore();
    listMatchesMock.mock.restore();
    getMatchByIdMock.mock.restore();
    upsertPredictionMock.mock.restore();
  }
});

test("PUT /api/v1/matches/:matchId/prediction returns MATCH_NOT_FOUND when match is missing", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const getMatchByIdMock = mock.method(matchesRepository, "getMatchById", async () => null);

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_999/prediction"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        homeScorePred: 2,
        awayScorePred: 0
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    assert.equal(response.status, 404);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "MATCH_NOT_FOUND");
    assert.equal(payload.error.message, "Match missing.");
  } finally {
    verifyIdTokenMock.mock.restore();
    getMatchByIdMock.mock.restore();
  }
});

test("PUT /api/v1/matches/:matchId/prediction returns MATCH_LOCKED when domain rejects edit", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => []);
  const getMatchByIdMock = mock.method(matchesRepository, "getMatchById", async () => ({
    matchId: "m_002",
    stage: "group",
    groupId: "A",
    homeTeamId: "mex",
    awayTeamId: "jpn",
    homeSlot: null,
    awaySlot: null,
    kickoffAt: "2026-06-12T19:00:00Z",
    status: "live",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: true,
    isScored: false,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z"
  }));

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_002/prediction"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        homeScorePred: 2,
        awayScorePred: 1
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
      };
    };

    assert.equal(response.status, 409);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "MATCH_LOCKED");
  } finally {
    verifyIdTokenMock.mock.restore();
    listMatchesMock.mock.restore();
    getMatchByIdMock.mock.restore();
  }
});

test("PUT /api/v1/matches/:matchId/prediction returns INVALID_KNOCKOUT_CLASSIFIER on draw without qualifier", async () => {
  const kickoffAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async () => []);
  const getMatchByIdMock = mock.method(matchesRepository, "getMatchById", async () => ({
    matchId: "m_073",
    stage: "R32",
    groupId: null,
    homeTeamId: "arg",
    awayTeamId: "ned",
    homeSlot: null,
    awaySlot: null,
    kickoffAt,
    status: "scheduled",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: false,
    isScored: false,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z"
  }));

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_073/prediction"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        homeScorePred: 1,
        awayScorePred: 1
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    assert.equal(response.status, 400);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "INVALID_KNOCKOUT_CLASSIFIER");
    assert.equal(payload.error.message, "Predicted qualifier is required when a knockout prediction ends in a draw.");
  } finally {
    verifyIdTokenMock.mock.restore();
    listMatchesMock.mock.restore();
    getMatchByIdMock.mock.restore();
  }
});

test("PUT /api/v1/matches/:matchId/prediction returns VALIDATION_ERROR for malformed payload", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_073/prediction"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        homeScorePred: "1",
        awayScorePred: 1
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error: {
        code: string;
        details: {
          issues: Array<{ path: string; message: string }>;
        };
      };
    };

    assert.equal(response.status, 400);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "VALIDATION_ERROR");
    assert.equal(payload.error.details.issues[0]?.path, "homeScorePred");
  } finally {
    verifyIdTokenMock.mock.restore();
  }
});
