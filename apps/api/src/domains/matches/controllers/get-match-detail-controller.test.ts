import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";
import { ApiError } from "../../../server/errors/api-error";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { matchesQueryService }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../services/matches-query-service")
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

test("GET /api/v1/matches/:matchId returns match detail envelope", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(matchesQueryService, "getMatchDetailForUser", async (userId: string, matchId: string) => {
    assert.equal(userId, "usr_1");
    assert.equal(matchId, "m_073");

    return {
      matchId: "m_073",
      stage: "R32",
      groupId: null,
      homeTeam: { teamId: "slot:2A", name: "Por definir (2A)", flagUrl: null },
      awayTeam: { teamId: "slot:2B", name: "Por definir (2B)", flagUrl: null },
      kickoffAt: "2026-06-27T19:00:00Z",
      status: "scheduled",
      deadlineAt: "2026-06-27T19:00:00Z",
      isLocked: false,
      isFinished: false,
      isScored: false,
      predictionStatus: "empty",
      userPredictionSummary: null,
      isEditable: true,
      ctaLabel: "Predecir",
      requiresQualifierIfDraw: true,
      officialResult: null,
      userPrediction: null,
      scoringRules: {
        exact90Points: 4,
        correctOutcome90Points: 2,
        correctQualifierPoints: 2
      }
    };
  });

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_073"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        matchId: string;
        requiresQualifierIfDraw: boolean;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.matchId, "m_073");
    assert.equal(payload.data.requiresQualifierIfDraw, true);
  } finally {
    verifyIdTokenMock.mock.restore();
    serviceMock.mock.restore();
  }
});

test("GET /api/v1/matches/:matchId returns MATCH_NOT_FOUND when service raises it", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const serviceMock = mock.method(matchesQueryService, "getMatchDetailForUser", async () => {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Match missing.", { matchId: "m_999" });
  });

  try {
    const response = await fetch(buildUrl("/api/v1/matches/m_999"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
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
    serviceMock.mock.restore();
  }
});
