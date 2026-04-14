import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { MacroTournamentResults } from "./macro-scoring-engine";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [
  { scoreMacroPredictionForUser },
  { macroPicksRepository },
  { macroScoringLogsRepository },
  { leagueMembersRepository },
  { predictionsRepository },
  { usersRepository },
  { leagueStandingsRepository }
] = await Promise.all([
  import("./score-macro-prediction"),
  import("../repositories/macro-picks-repository"),
  import("../repositories/macro-scoring-logs-repository"),
  import("../../leagues/repositories/league-members-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("../../users/repositories/users-repository"),
  import("../../leagues/repositories/league-standings-repository")
]);

test("scoreMacroPredictionForUser persists macro points and rebuilds affected standings", async () => {
  const getPredictionMock = mock.method(macroPicksRepository, "getByUserId", async () => ({
    userId: "usr_1",
    groupPicks: {
      A: { firstTeamId: "ARG", secondTeamId: "MEX" }
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
    lockedAt: "2026-06-11T19:00:00Z"
  }));
  const upsertLogMock = mock.method(macroScoringLogsRepository, "upsert", async () => undefined);
  const listMacroLogsMock = mock.method(macroScoringLogsRepository, "listByUserId", async () => [
    {
      userId: "usr_1",
      tournamentId: "wc2026",
      totalPoints: 65,
      breakdown: {
        groupPoints: 20,
        finalistsPoints: 20,
        championPoints: 25,
        adjustmentPenaltyApplied: false,
        totalPoints: 65
      },
      isAdjusted: false,
      createdAt: "2026-07-20T12:00:00Z"
    }
  ]);
  const membershipsMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lm_1", leagueId: "league_1", userId: "usr_1", role: "owner", joinedAt: "2026-06-01T00:00:00Z" }
  ]);
  const membershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lm_1", leagueId: "league_1", userId: "usr_1", role: "owner", joinedAt: "2026-06-01T00:00:00Z" }
  ]);
  const listPredictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => []);
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
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => [
    {
      userId: "usr_1",
      displayName: "Tomas",
      email: "tomas@test.dev",
      country: null,
      photoUrl: null,
      totalPoints: 65,
      macroPoints: 65,
      exactHits: 0,
      correctSigns: 0,
      leaguesCount: 1,
      profileCompleted: true
    }
  ]);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);

  try {
    const result = await scoreMacroPredictionForUser(
      "usr_1",
      "wc2026",
      {
        groups: {
          A: { firstTeamId: "ARG", secondTeamId: "MEX" }
        } as MacroTournamentResults["groups"],
        finalists: ["ARG", "BRA"],
        champion: "ARG"
      },
      "2026-07-20T12:00:00Z"
    );

    assert.equal(result.totalPoints, 65);
    assert.equal(upsertLogMock.mock.callCount(), 1);
    assert.equal(upsertProfileMock.mock.callCount(), 1);
    assert.equal(replaceStandingsMock.mock.callCount(), 1);
  } finally {
    getPredictionMock.mock.restore();
    upsertLogMock.mock.restore();
    listMacroLogsMock.mock.restore();
    membershipsMock.mock.restore();
    membershipsByLeagueMock.mock.restore();
    listPredictionsMock.mock.restore();
    findByUserIdMock.mock.restore();
    upsertProfileMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
  }
});
