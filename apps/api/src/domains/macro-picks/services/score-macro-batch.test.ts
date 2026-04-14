import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { MacroTournamentResults } from "@prode/shared";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

const [
  batchModule,
  { macroPicksRepository },
  { macroResultsRepository },
  { macroScoringLogsRepository },
  { leagueMembersRepository },
  { predictionsRepository },
  { usersRepository },
  { leagueStandingsRepository }
] = await Promise.all([
  import("./score-macro-batch"),
  import("../repositories/macro-picks-repository"),
  import("../repositories/macro-results-repository"),
  import("../repositories/macro-scoring-logs-repository"),
  import("../../leagues/repositories/league-members-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("../../users/repositories/users-repository"),
  import("../../leagues/repositories/league-standings-repository")
]);

function buildResults(): MacroTournamentResults {
  return {
    groups: {
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
    champion: "ARG"
  };
}

test("scoreMacroBatch scores all submitted macro predictions for a tournament", async () => {
  const listSubmittedMock = mock.method(macroPicksRepository, "listSubmitted", async () => [
    {
      userId: "usr_1",
      groupPicks: buildResults().groups,
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
    }
  ]);
  const getResultsMock = mock.method(macroResultsRepository, "getByTournamentId", async () => ({
    tournamentId: "wc2026",
    ...buildResults(),
    updatedAt: "2026-07-20T12:00:00Z"
  }));
  const upsertLogMock = mock.method(macroScoringLogsRepository, "upsert", async () => undefined);
  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lm_1", leagueId: "league_1", userId: "usr_1", role: "owner", joinedAt: "2026-06-01T00:00:00Z" }
  ]);
  const membershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => [
    { membershipId: "lm_1", leagueId: "league_1", userId: "usr_1", role: "owner", joinedAt: "2026-06-01T00:00:00Z" }
  ]);
  const predictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => []);
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
  const listLogsByUserMock = mock.method(macroScoringLogsRepository, "listByUserId", async () => [
    {
      userId: "usr_1",
      tournamentId: "wc2026",
      totalPoints: 165,
      breakdown: {
        groupPoints: 120,
        finalistsPoints: 20,
        championPoints: 25,
        adjustmentPenaltyApplied: false,
        totalPoints: 165
      },
      isAdjusted: false,
      createdAt: "2026-07-20T12:00:00Z"
    }
  ]);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => [
    {
      userId: "usr_1",
      displayName: "Tomas",
      email: "tomas@test.dev",
      country: null,
      photoUrl: null,
      totalPoints: 165,
      macroPoints: 165,
      exactHits: 0,
      correctSigns: 0,
      leaguesCount: 1,
      profileCompleted: true
    }
  ]);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);

  try {
    const summary = await batchModule.scoreMacroBatch("wc2026");

    assert.equal(summary.usersProcessed, 1);
    assert.equal(summary.affectedLeagues, 1);
    assert.equal(upsertLogMock.mock.callCount(), 1);
    assert.equal(upsertProfileMock.mock.callCount(), 1);
    assert.equal(replaceStandingsMock.mock.callCount(), 1);
  } finally {
    listSubmittedMock.mock.restore();
    getResultsMock.mock.restore();
    upsertLogMock.mock.restore();
    membershipsByUserMock.mock.restore();
    membershipsByLeagueMock.mock.restore();
    predictionsMock.mock.restore();
    findByUserIdMock.mock.restore();
    listLogsByUserMock.mock.restore();
    upsertProfileMock.mock.restore();
    listByUserIdsMock.mock.restore();
    replaceStandingsMock.mock.restore();
  }
});

test("rebuildMacroScoring clears old logs before recomputing the tournament", async () => {
  const listByTournamentMock = mock.method(macroScoringLogsRepository, "listByTournamentId", async () => [
    {
      userId: "usr_old",
      tournamentId: "wc2026",
      totalPoints: 12,
      breakdown: {
        groupPoints: 0,
        finalistsPoints: 0,
        championPoints: 12,
        adjustmentPenaltyApplied: true,
        totalPoints: 12
      },
      isAdjusted: true,
      createdAt: "2026-07-19T12:00:00Z"
    }
  ]);
  const deleteMock = mock.method(macroScoringLogsRepository, "deleteByTournamentId", async () => 1);
  const listSubmittedMock = mock.method(macroPicksRepository, "listSubmitted", async () => []);
  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);
  const predictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => []);
  const findByUserIdMock = mock.method(usersRepository, "findByUserId", async () => ({
    userId: "usr_old",
    displayName: "Old",
    email: "old@test.dev",
    country: null,
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true
  }));
  const listLogsByUserMock = mock.method(macroScoringLogsRepository, "listByUserId", async () => []);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);

  try {
    const summary = await batchModule.rebuildMacroScoring("wc2026", buildResults());

    assert.equal(summary.clearedLogs, 1);
    assert.equal(summary.usersProcessed, 0);
    assert.equal(deleteMock.mock.callCount(), 1);
    assert.equal(listSubmittedMock.mock.callCount(), 1);
  } finally {
    listByTournamentMock.mock.restore();
    deleteMock.mock.restore();
    listSubmittedMock.mock.restore();
    membershipsByUserMock.mock.restore();
    predictionsMock.mock.restore();
    findByUserIdMock.mock.restore();
    listLogsByUserMock.mock.restore();
    upsertProfileMock.mock.restore();
  }
});
