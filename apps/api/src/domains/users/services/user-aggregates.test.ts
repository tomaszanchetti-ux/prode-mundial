import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [{ rebuildUserAggregates }, { usersRepository }, { predictionsRepository }, { championScoringLogsRepository }] = await Promise.all([
  import("./user-aggregates"),
  import("../repositories/users-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("../../macro-picks/repositories/macro-scoring-logs-repository")
]);

test("rebuildUserAggregates recomputes totalPoints including macro scoring logs", async () => {
  const findByUserIdMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_1",
    displayName: "Tomas",
    email: "tomas@test.dev",
    country: null,
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 1,
    profileCompleted: true
  }));
  const predictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => [
    {
      predictionId: "pred_1",
      userId: "usr_1",
      matchId: "m_1",
      homeScorePred: 2,
      awayScorePred: 1,
      isLocked: true,
      isScored: true,
      pointsAwarded: 5,
      scoringBreakdown: { exact90Points: 5, outcome90Points: 0, totalPoints: 5 },
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      scoredAt: "2026-06-12T00:00:00Z"
    }
  ]);
  const macroLogsMock = mock.method(championScoringLogsRepository, "listByUserId", async () => [
    {
      userId: "usr_1",
      tournamentId: "wc2026",
      totalPoints: 47,
      breakdown: {
        groupPoints: 30,
        finalistsPoints: 5,
        championPoints: 12,
        adjustmentPenaltyApplied: true,
        totalPoints: 47
      },
      isAdjusted: true,
      createdAt: "2026-07-20T12:00:00Z"
    }
  ]);
  const upsertMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const profile = await rebuildUserAggregates("usr_1");

    assert.equal(profile?.totalPoints, 52);
    assert.equal(profile?.macroPoints, 47);
    assert.equal(profile?.exactHits, 1);
    assert.equal(profile?.correctSigns, 0);
    assert.equal(upsertMock.mock.callCount(), 1);
  } finally {
    findByUserIdMock.mock.restore();
    predictionsMock.mock.restore();
    macroLogsMock.mock.restore();
    upsertMock.mock.restore();
  }
});
