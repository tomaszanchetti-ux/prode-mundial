import assert from "node:assert/strict";
import { mock, test } from "node:test";

process.env.FIREBASE_PROJECT_ID ??= "demo-prode";
process.env.FIREBASE_CLIENT_EMAIL ??= "firebase-adminsdk@test.local";
process.env.FIREBASE_PRIVATE_KEY ??=
  "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAMfe9B1wxxL2Bkwvs71MaSBu5LUirhmHsarDuqsbonKnZuXeQVoc\n+3v6INANIlMAPbyX3IiSTidqwa3JEsmMxtkCAwEAAQJBAKUwcsfmTtIv/jJ3dnEs\ntvI0VNgUKpo1GTUOgbgrpc5lcPAeFlSIId8ZyiBd/KBT2js/ierOgmL/EgzGaMep\nHhECIQDjASMe4DBkuZzyJrDcTREaXmZRr0ZaqRty5SXzR5KpbQIhAOFmkl95xoV5\nW8NoK4k0vvECPV8cKY/KK2IHq3BRUfudAiATkRiG48ooFHu7v6wFATuVK0fkiJgm\n3ma4S5ou0x+ILQIgJFtSItpWnjLsDUHhO9lpLyDIW24EejAG/WH1UkGbsrUCIHS+\n+BtOHeKqgGjtfGbuovhxUIIDnPmB1eKWSrihDXKA\n-----END RSA PRIVATE KEY-----\n";

import type { StoredMatch } from "../../matches/types";

const [
  batchModule,
  { championPicksRepository },
  { subChampionPicksRepository },
  { bestPlayerPicksRepository },
  {
    championResultsRepository,
    subChampionResultsRepository,
    bestPlayerResultsRepository
  },
  { championScoringLogsRepository },
  { matchesRepository },
  { leagueMembersRepository },
  { predictionsRepository },
  { usersRepository },
  { leagueStandingsRepository }
] = await Promise.all([
  import("./score-macro-batch"),
  import("../repositories/macro-picks-repository"),
  import("../repositories/sub-champion-picks-repository"),
  import("../repositories/best-player-picks-repository"),
  import("../repositories/macro-results-repository"),
  import("../repositories/macro-scoring-logs-repository"),
  import("../../matches/repositories/matches-repository"),
  import("../../leagues/repositories/league-members-repository"),
  import("../../matches/repositories/predictions-repository"),
  import("../../users/repositories/users-repository"),
  import("../../leagues/repositories/league-standings-repository")
]);

// ── Fixture helpers ─────────────────────────────────────

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

function stubUserAggregateMocks() {
  const findByUserIdMock = mock.method(usersRepository, "findByUserId", async (userId: string) => ({
    userId,
    displayName: userId,
    email: `${userId}@test.dev`,
    country: null,
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: true
  }));
  const predictionsMock = mock.method(predictionsRepository, "listPredictionsByUser", async () => []);
  const listLogsByUserMock = mock.method(championScoringLogsRepository, "listByUserId", async () => []);
  const upsertProfileMock = mock.method(usersRepository, "upsertProfile", async () => undefined);
  const listByUserIdsMock = mock.method(usersRepository, "listByUserIds", async () => []);
  const replaceStandingsMock = mock.method(leagueStandingsRepository, "replaceStandings", async () => undefined);
  const membershipsByLeagueMock = mock.method(leagueMembersRepository, "listMembershipsByLeague", async () => []);

  return {
    restore: () => {
      findByUserIdMock.mock.restore();
      predictionsMock.mock.restore();
      listLogsByUserMock.mock.restore();
      upsertProfileMock.mock.restore();
      listByUserIdsMock.mock.restore();
      replaceStandingsMock.mock.restore();
      membershipsByLeagueMock.mock.restore();
    }
  };
}

// ── Tests ───────────────────────────────────────────────

test("scoreMacroBatch scores champion predictions when result is already persisted", async () => {
  const championListMock = mock.method(championPicksRepository, "listAll", async () => [
    {
      userId: "usr_1",
      championTeamId: "ARG",
      adjustedChampionTeamId: null,
      isLocked: true,
      isAdjusted: false,
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      adjustedAt: null
    }
  ]);
  const subListMock = mock.method(subChampionPicksRepository, "listAll", async () => []);
  const bestListMock = mock.method(bestPlayerPicksRepository, "listAll", async () => []);
  const championGetMock = mock.method(championResultsRepository, "getByTournamentId", async () => ({
    tournamentId: "wc2026",
    championTeamId: "ARG",
    updatedAt: "2026-07-20T12:00:00Z"
  }));
  const subGetMock = mock.method(subChampionResultsRepository, "getByTournamentId", async () => null);
  const bestGetMock = mock.method(bestPlayerResultsRepository, "getByTournamentId", async () => null);
  const matchesListMock = mock.method(matchesRepository, "listMatches", async () => []);

  const logGetMock = mock.method(championScoringLogsRepository, "getByUserIdAndTournamentId", async () => null);
  const logUpsertMock = mock.method(championScoringLogsRepository, "upsert", async () => undefined);

  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => [
    { membershipId: "lm_1", leagueId: "league_1", userId: "usr_1", role: "owner", joinedAt: "2026-06-01T00:00:00Z" }
  ]);

  const aggregates = stubUserAggregateMocks();

  try {
    const summary = await batchModule.scoreMacroBatch("wc2026");

    assert.equal(summary.usersProcessed, 1);
    assert.equal(summary.championScored, 1);
    assert.equal(summary.subChampionScored, 0);
    assert.equal(summary.bestPlayerScored, 0);
    assert.equal(summary.missing.champion, false);
    assert.equal(summary.missing.subChampion, true);
    assert.equal(summary.missing.bestPlayer, true);
    assert.equal(logUpsertMock.mock.callCount(), 1);
  } finally {
    championListMock.mock.restore();
    subListMock.mock.restore();
    bestListMock.mock.restore();
    championGetMock.mock.restore();
    subGetMock.mock.restore();
    bestGetMock.mock.restore();
    matchesListMock.mock.restore();
    logGetMock.mock.restore();
    logUpsertMock.mock.restore();
    membershipsByUserMock.mock.restore();
    aggregates.restore();
  }
});

test("scoreMacroBatch auto-derives champion + sub-champion from the finalized Final match", async () => {
  const championListMock = mock.method(championPicksRepository, "listAll", async () => [
    {
      userId: "usr_champ",
      championTeamId: "ARG",
      adjustedChampionTeamId: null,
      isLocked: true,
      isAdjusted: false,
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      adjustedAt: null
    }
  ]);
  const subListMock = mock.method(subChampionPicksRepository, "listAll", async () => [
    {
      userId: "usr_sub",
      subChampionTeamId: "BRA",
      adjustedSubChampionTeamId: null,
      isLocked: true,
      isAdjusted: false,
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      adjustedAt: null
    }
  ]);
  const bestListMock = mock.method(bestPlayerPicksRepository, "listAll", async () => []);

  // Nada persistido — se auto-derive desde la Final.
  const championGetMock = mock.method(championResultsRepository, "getByTournamentId", async () => null);
  const subGetMock = mock.method(subChampionResultsRepository, "getByTournamentId", async () => null);
  const bestGetMock = mock.method(bestPlayerResultsRepository, "getByTournamentId", async () => null);

  const matchesListMock = mock.method(matchesRepository, "listMatches", async () => [
    buildMatch({ matchId: "m_100", stage: "SF", kickoffAt: "2026-07-15T19:00:00Z", status: "finished" }),
    buildMatch({
      matchId: "m_104",
      stage: "FINAL",
      groupId: null,
      homeTeamId: "ARG",
      awayTeamId: "BRA",
      winnerTeamId: "ARG",
      status: "finished",
      kickoffAt: "2026-07-19T19:00:00Z"
    })
  ]);

  const championUpsertResultMock = mock.method(championResultsRepository, "upsert", async () => undefined);
  const subUpsertResultMock = mock.method(subChampionResultsRepository, "upsert", async () => undefined);

  const logGetMock = mock.method(championScoringLogsRepository, "getByUserIdAndTournamentId", async () => null);
  const logUpsertMock = mock.method(championScoringLogsRepository, "upsert", async () => undefined);

  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);

  const aggregates = stubUserAggregateMocks();

  try {
    const summary = await batchModule.scoreMacroBatch("wc2026");

    assert.equal(summary.championScored, 1);
    assert.equal(summary.subChampionScored, 1);
    assert.equal(summary.missing.champion, false);
    assert.equal(summary.missing.subChampion, false);
    // Both results got persisted for future reads.
    assert.equal(championUpsertResultMock.mock.callCount(), 1);
    assert.equal(subUpsertResultMock.mock.callCount(), 1);
    // 2 log upserts (1 per user).
    assert.equal(logUpsertMock.mock.callCount(), 2);
  } finally {
    championListMock.mock.restore();
    subListMock.mock.restore();
    bestListMock.mock.restore();
    championGetMock.mock.restore();
    subGetMock.mock.restore();
    bestGetMock.mock.restore();
    matchesListMock.mock.restore();
    championUpsertResultMock.mock.restore();
    subUpsertResultMock.mock.restore();
    logGetMock.mock.restore();
    logUpsertMock.mock.restore();
    membershipsByUserMock.mock.restore();
    aggregates.restore();
  }
});

test("scoreMacroBatch scores best-player picks when result is persisted", async () => {
  const championListMock = mock.method(championPicksRepository, "listAll", async () => []);
  const subListMock = mock.method(subChampionPicksRepository, "listAll", async () => []);
  const bestListMock = mock.method(bestPlayerPicksRepository, "listAll", async () => [
    {
      userId: "usr_bp",
      bestPlayerId: "ply-messi",
      adjustedBestPlayerId: null,
      isLocked: true,
      isAdjusted: false,
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
      lockedAt: "2026-06-11T19:00:00Z",
      adjustedAt: null
    }
  ]);

  const championGetMock = mock.method(championResultsRepository, "getByTournamentId", async () => null);
  const subGetMock = mock.method(subChampionResultsRepository, "getByTournamentId", async () => null);
  const bestGetMock = mock.method(bestPlayerResultsRepository, "getByTournamentId", async () => ({
    tournamentId: "wc2026",
    bestPlayerId: "ply-messi",
    updatedAt: "2026-07-20T12:00:00Z"
  }));

  const matchesListMock = mock.method(matchesRepository, "listMatches", async () => []);

  const logGetMock = mock.method(championScoringLogsRepository, "getByUserIdAndTournamentId", async () => null);
  const logUpsertMock = mock.method(championScoringLogsRepository, "upsert", async () => undefined);

  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);

  const aggregates = stubUserAggregateMocks();

  try {
    const summary = await batchModule.scoreMacroBatch("wc2026");

    assert.equal(summary.bestPlayerScored, 1);
    assert.equal(summary.missing.bestPlayer, false);
    assert.equal(logUpsertMock.mock.callCount(), 1);
    // Verify totalPoints = bestPlayerPoints (25) since no other pick.
    const upsertedLog = logUpsertMock.mock.calls[0]?.arguments[0];
    assert.ok(upsertedLog);
    assert.equal(upsertedLog.bestPlayerPoints, 20);
    assert.equal(upsertedLog.totalPoints, 20);
  } finally {
    championListMock.mock.restore();
    subListMock.mock.restore();
    bestListMock.mock.restore();
    championGetMock.mock.restore();
    subGetMock.mock.restore();
    bestGetMock.mock.restore();
    matchesListMock.mock.restore();
    logGetMock.mock.restore();
    logUpsertMock.mock.restore();
    membershipsByUserMock.mock.restore();
    aggregates.restore();
  }
});

test("scoreMacroBatch reports missing flags when no results and no Final match", async () => {
  const championListMock = mock.method(championPicksRepository, "listAll", async () => []);
  const subListMock = mock.method(subChampionPicksRepository, "listAll", async () => []);
  const bestListMock = mock.method(bestPlayerPicksRepository, "listAll", async () => []);

  const championGetMock = mock.method(championResultsRepository, "getByTournamentId", async () => null);
  const subGetMock = mock.method(subChampionResultsRepository, "getByTournamentId", async () => null);
  const bestGetMock = mock.method(bestPlayerResultsRepository, "getByTournamentId", async () => null);

  // No FINAL match → auto-derive returns null.
  const matchesListMock = mock.method(matchesRepository, "listMatches", async () => []);

  const aggregates = stubUserAggregateMocks();

  try {
    const summary = await batchModule.scoreMacroBatch("wc2026");

    assert.equal(summary.championScored, 0);
    assert.equal(summary.subChampionScored, 0);
    assert.equal(summary.bestPlayerScored, 0);
    assert.equal(summary.missing.champion, true);
    assert.equal(summary.missing.subChampion, true);
    assert.equal(summary.missing.bestPlayer, true);
  } finally {
    championListMock.mock.restore();
    subListMock.mock.restore();
    bestListMock.mock.restore();
    championGetMock.mock.restore();
    subGetMock.mock.restore();
    bestGetMock.mock.restore();
    matchesListMock.mock.restore();
    aggregates.restore();
  }
});

test("rebuildMacroScoring clears old logs before recomputing the tournament", async () => {
  const listByTournamentMock = mock.method(championScoringLogsRepository, "listByTournamentId", async () => [
    {
      userId: "usr_old",
      tournamentId: "wc2026",
      totalPoints: 10,
      championPoints: 10,
      wasAdjusted: true,
      scoredAt: "2026-07-19T12:00:00Z"
    }
  ]);
  const deleteMock = mock.method(championScoringLogsRepository, "deleteByTournamentId", async () => 1);

  const championListMock = mock.method(championPicksRepository, "listAll", async () => []);
  const subListMock = mock.method(subChampionPicksRepository, "listAll", async () => []);
  const bestListMock = mock.method(bestPlayerPicksRepository, "listAll", async () => []);

  const championGetMock = mock.method(championResultsRepository, "getByTournamentId", async () => ({
    tournamentId: "wc2026",
    championTeamId: "ARG",
    updatedAt: "2026-07-20T12:00:00Z"
  }));
  const subGetMock = mock.method(subChampionResultsRepository, "getByTournamentId", async () => null);
  const bestGetMock = mock.method(bestPlayerResultsRepository, "getByTournamentId", async () => null);
  const matchesListMock = mock.method(matchesRepository, "listMatches", async () => []);

  const membershipsByUserMock = mock.method(leagueMembersRepository, "listMembershipsByUser", async () => []);
  const aggregates = stubUserAggregateMocks();

  try {
    const summary = await batchModule.rebuildMacroScoring("wc2026");

    assert.equal(summary.clearedLogs, 1);
    assert.equal(summary.usersProcessed, 0);
    assert.equal(deleteMock.mock.callCount(), 1);
    assert.equal(championListMock.mock.callCount(), 1);
  } finally {
    listByTournamentMock.mock.restore();
    deleteMock.mock.restore();
    championListMock.mock.restore();
    subListMock.mock.restore();
    bestListMock.mock.restore();
    championGetMock.mock.restore();
    subGetMock.mock.restore();
    bestGetMock.mock.restore();
    matchesListMock.mock.restore();
    membershipsByUserMock.mock.restore();
    aggregates.restore();
  }
});
