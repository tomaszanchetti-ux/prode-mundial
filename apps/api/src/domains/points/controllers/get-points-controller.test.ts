import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import type { AddressInfo } from "node:net";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";
process.env.NEXT_PUBLIC_WEB_URL ??= "http://localhost:3000";

const [{ createApp }, { firebaseAdminAuth }, { usersRepository }, { predictionsRepository }, { matchesRepository }, { teamsRepository }, { macroScoringLogsRepository }] = await Promise.all([
  import("../../../server/app"),
  import("../../../server/firebase/firebase-admin"),
  import("../../users/repositories/users-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("../../matches/repositories/matches-repository"),
  import("../../matches/repositories/teams-repository"),
  import("../../macro-picks/repositories/macro-scoring-logs-repository")
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

test("GET /api/v1/points returns current user points summary", async () => {
  const verifyIdTokenMock = mock.method(firebaseAdminAuth, "verifyIdToken", async () => ({
    uid: "usr_1",
    email: "tomas@example.com",
    name: "Tomas"
  }));
  const profileMock = mock.method(usersRepository, "findByUserId", async (userId: string) => {
    assert.equal(userId, "usr_1");
    return {
      userId: "usr_1",
      displayName: "Tomas",
      email: "tomas@example.com",
      country: "AR",
      photoUrl: null,
      totalPoints: 18,
      macroPoints: 6,
      exactHits: 2,
      correctSigns: 4,
      leaguesCount: 2,
      profileCompleted: true
    };
  });
  const predictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => [
    {
      predictionId: "pred_1",
      userId: "usr_1",
      matchId: "m_001",
      homeScorePred: 2,
      awayScorePred: 1,
      predictedQualifierTeamId: null,
      isLocked: true,
      isScored: true,
      pointsAwarded: 12,
      scoringBreakdown: {
        exact90Points: 4,
        outcome90Points: 2,
        qualifierPoints: 6,
        totalPoints: 12
      },
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-12T00:00:00Z",
      lockedAt: "2026-06-11T18:30:00Z",
      scoredAt: "2026-06-12T21:00:00Z"
    }
  ]);
  const matchesMock = mock.method(matchesRepository, "listMatches", async () => [
    {
      matchId: "m_001",
      stage: "group",
      groupId: "A",
      homeTeamId: "ARG",
      awayTeamId: "BRA",
      kickoffAt: "2026-06-11T19:00:00Z",
      status: "finished",
      homeScore90: 2,
      awayScore90: 1,
      winnerTeamId: "ARG",
      isLocked: true,
      isScored: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-06-12T21:00:00Z"
    }
  ]);
  const teamsMock = mock.method(teamsRepository, "getTeamsByIds", async () => new Map());
  const macroLogsMock = mock.method(macroScoringLogsRepository, "listByUserId", async () => [
    {
      userId: "usr_1",
      tournamentId: "wc2026",
      totalPoints: 6,
      breakdown: {
        groupPoints: 0,
        finalistsPoints: 0,
        championPoints: 6,
        adjustmentPenaltyApplied: true,
        totalPoints: 6
      },
      isAdjusted: true,
      createdAt: "2026-07-20T00:00:00Z"
    }
  ]);

  try {
    const response = await fetch(buildUrl("/api/v1/points"), {
      headers: {
        Authorization: "Bearer valid-token"
      }
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        totalPoints: number;
        macroPoints: number;
        matchPoints: number;
        byStage: {
          group: number;
          macro: number;
        };
      };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.totalPoints, 18);
    assert.equal(payload.data.matchPoints, 12);
    assert.equal(payload.data.macroPoints, 6);
    assert.equal(payload.data.byStage.group, 12);
    assert.equal(payload.data.byStage.macro, 6);
  } finally {
    verifyIdTokenMock.mock.restore();
    profileMock.mock.restore();
    predictionsMock.mock.restore();
    matchesMock.mock.restore();
    teamsMock.mock.restore();
    macroLogsMock.mock.restore();
  }
});
