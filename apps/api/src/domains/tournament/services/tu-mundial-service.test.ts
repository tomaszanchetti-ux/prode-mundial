import assert from "node:assert/strict";
import test, { mock } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

type StoredMatch = import("../../matches/types").StoredMatch;
type StoredPrediction = import("../../matches/types").StoredPrediction;
type StoredTeam = import("../../matches/types").StoredTeam;

const [{ matchesRepository }, { predictionsRepository }, { teamsRepository }, { preTournamentSummaryService }, { TuMundialService }] =
  await Promise.all([
    import("../../matches/repositories/matches-repository"),
    import("../../matches/repositories/predictions-repository"),
    import("../../matches/repositories/teams-repository"),
    import("./pre-tournament-summary-service"),
    import("./tu-mundial-service")
  ]);

function buildMatch(overrides: Partial<StoredMatch> = {}): StoredMatch {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeamId: "MEX",
    awayTeamId: "RSA",
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
    predictionId: "pred_1",
    userId: "usr_1",
    matchId: "m_001",
    homeScorePred: 2,
    awayScorePred: 1,
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

function buildTeam(teamId: string, name: string, groupId = "A"): StoredTeam {
  return {
    teamId,
    fifaCode: teamId,
    name,
    shortName: name,
    flagUrl: null,
    groupId,
    isActive: true,
    createdAt: "2026-04-09T00:00:00Z",
    updatedAt: "2026-04-09T00:00:00Z"
  };
}

test("getTuMundialForUser builds projected standings grouped by user predictions", async () => {
  const service = new TuMundialService();
  const matchesMock = mock.method(matchesRepository, "listMatches", async (input?: { stage?: string }) => {
    assert.equal(input?.stage, "group");

    return [
      buildMatch({ matchId: "m_001", groupId: "A", homeTeamId: "MEX", awayTeamId: "RSA" }),
      buildMatch({ matchId: "m_002", groupId: "A", homeTeamId: "KOR", awayTeamId: "CZE", kickoffAt: "2026-06-12T19:00:00Z" })
    ];
  });
  const predictionsMock = mock.method(
    predictionsRepository,
    "listPredictionsByUserForMatches",
    async () =>
      new Map<string, StoredPrediction>([
        [
          "m_001",
          buildPrediction({
            matchId: "m_001",
            homeScorePred: 3,
            awayScorePred: 1
          })
        ]
      ])
  );
  const teamsMock = mock.method(
    teamsRepository,
    "getTeamsByIds",
    async () =>
      new Map<string, StoredTeam>([
        ["MEX", buildTeam("MEX", "Mexico")],
        ["RSA", buildTeam("RSA", "South Africa")],
        ["KOR", buildTeam("KOR", "Korea Republic")],
        ["CZE", buildTeam("CZE", "Czechia")]
      ])
  );
  const preTournamentMock = mock.method(preTournamentSummaryService, "getSummaryForUser", async () => ({
    isPreTournament: true,
    completedMatches: 1,
    totalMatches: 48,
    remainingMatches: 47,
    completionPercentage: 2,
    nextPendingMatchId: "m_002"
  }));

  try {
    const response = await service.getTuMundialForUser("usr_1", new Date("2026-06-01T12:00:00Z"));
    const groupA = response.groups.find((group) => group.groupId === "A");

    assert.equal(response.mode, "pre_tournament");
    assert.ok(groupA);
    assert.equal(groupA?.completedMatches, 1);
    assert.equal(groupA?.items[0]?.teamId, "MEX");
    assert.equal(groupA?.items[0]?.points, 3);
    assert.equal(groupA?.items[0]?.goalDifference, 2);
    assert.equal(groupA?.items[0]?.isProjectedQualified, true);
    assert.equal(groupA?.items[3]?.teamId, "RSA");
    assert.equal(groupA?.items[3]?.points, 0);
  } finally {
    matchesMock.mock.restore();
    predictionsMock.mock.restore();
    teamsMock.mock.restore();
    preTournamentMock.mock.restore();
  }
});
