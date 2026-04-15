import assert from "node:assert/strict";
import test, { mock } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

type StoredMatch = import("../../matches/types").StoredMatch;
type StoredPrediction = import("../../matches/types").StoredPrediction;

const [{ matchesRepository }, { predictionsRepository }, { PreTournamentSummaryService }] = await Promise.all([
  import("../../matches/repositories/matches-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("./pre-tournament-summary-service")
]);

function buildMatch(overrides: Partial<StoredMatch> = {}): StoredMatch {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeamId: "ARG",
    awayTeamId: "BRA",
    homeSlot: null,
    awaySlot: null,
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "scheduled",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: false,
    isScored: false,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

function buildPrediction(overrides: Partial<StoredPrediction> = {}): StoredPrediction {
  return {
    predictionId: "pred_usr_1_m_001",
    userId: "usr_1",
    matchId: "m_001",
    homeScorePred: 1,
    awayScorePred: 0,
    predictedWinnerTeamId: null,
    predictedQualifierTeamId: null,
    isLocked: false,
    isScored: false,
    pointsAwarded: 0,
    scoringBreakdown: null,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

test("getSummaryForUser returns group progress and next pending match in chronological order", async () => {
  const service = new PreTournamentSummaryService();
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async (input?: { stage?: string }) => {
    if (input?.stage === "group") {
      return [
        buildMatch({ matchId: "m_001", groupId: "A", kickoffAt: "2026-06-11T19:00:00Z" }),
        buildMatch({ matchId: "m_002", groupId: "A", kickoffAt: "2026-06-12T19:00:00Z" }),
        buildMatch({ matchId: "m_003", groupId: "B", kickoffAt: "2026-06-13T19:00:00Z" })
      ];
    }

    return [
      buildMatch({ matchId: "m_001", groupId: "A", kickoffAt: "2026-06-11T19:00:00Z" }),
      buildMatch({ matchId: "m_010", stage: "R32", groupId: null, kickoffAt: "2026-06-27T19:00:00Z" })
    ];
  });
  const predictionsMock = mock.method(
    predictionsRepository,
    "listPredictionsByUserForMatches",
    async (_userId: string, matchIds: string[]) =>
      new Map(
        [buildPrediction({ matchId: "m_001" }), buildPrediction({ predictionId: "pred_usr_1_m_003", matchId: "m_003" })]
          .filter((prediction) => matchIds.includes(prediction.matchId))
          .map((prediction) => [prediction.matchId, prediction])
      )
  );

  try {
    const summary = await service.getSummaryForUser("usr_1", new Date("2026-06-11T10:00:00Z"));

    assert.deepEqual(summary, {
      isPreTournament: true,
      completedMatches: 2,
      totalMatches: 3,
      remainingMatches: 1,
      completionPercentage: 67,
      nextPendingMatchId: "m_002"
    });
  } finally {
    listMatchesMock.mock.restore();
    predictionsMock.mock.restore();
  }
});

test("getSummaryForUser exits pre-tournament once the first match has kicked off", async () => {
  const service = new PreTournamentSummaryService();
  const listMatchesMock = mock.method(matchesRepository, "listMatches", async (input?: { stage?: string }) => {
    if (input?.stage === "group") {
      return [buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" })];
    }

    return [buildMatch({ matchId: "m_001", kickoffAt: "2026-06-11T19:00:00Z" })];
  });
  const predictionsMock = mock.method(
    predictionsRepository,
    "listPredictionsByUserForMatches",
    async () => new Map<string, StoredPrediction>()
  );

  try {
    const summary = await service.getSummaryForUser("usr_1", new Date("2026-06-11T19:30:00Z"));

    assert.equal(summary.isPreTournament, false);
    assert.equal(summary.nextPendingMatchId, "m_001");
    assert.equal(summary.completionPercentage, 0);
  } finally {
    listMatchesMock.mock.restore();
    predictionsMock.mock.restore();
  }
});
