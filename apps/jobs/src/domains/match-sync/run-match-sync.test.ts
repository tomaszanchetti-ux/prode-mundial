import assert from "node:assert/strict";
import test from "node:test";
import type { FootballDataMatch } from "./services/football-data-client";
import { mapExternalStatus, normalizeTeamCode, resolveScore90 } from "./services/football-data-client";
import { findInternalMatch, needsUpdate, resolveWinnerTeamId } from "./services/match-sync-logic";
import type { SyncStoredMatch } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────

function buildInternalMatch(overrides: Partial<SyncStoredMatch> = {}): SyncStoredMatch {
  return {
    matchId: "m_001",
    stage: "group",
    homeTeamId: "ARG",
    awayTeamId: "BRA",
    kickoffAt: "2026-06-11T19:00:00Z",
    status: "scheduled",
    homeScore90: null,
    awayScore90: null,
    winnerTeamId: null,
    isLocked: false,
    isScored: false,
    updatedAt: "2026-04-09T00:00:00Z",
    ...overrides
  };
}

function buildExternalMatch(overrides: Partial<FootballDataMatch> = {}): FootballDataMatch {
  return {
    id: 99001,
    utcDate: "2026-06-11T19:00:00Z",
    status: "FINISHED",
    matchday: 1,
    stage: "GROUP_STAGE",
    group: "Group A",
    homeTeam: { id: 762, name: "Argentina", shortName: "Argentina", tla: "ARG" },
    awayTeam: { id: 764, name: "Brazil", shortName: "Brazil", tla: "BRA" },
    score: {
      winner: "HOME_TEAM",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 1, away: 0 }
    },
    ...overrides
  };
}

// ─── mapExternalStatus ──────────────────────────────────────────────

test("mapExternalStatus: SCHEDULED → scheduled", () => {
  assert.equal(mapExternalStatus("SCHEDULED"), "scheduled");
});

test("mapExternalStatus: TIMED → scheduled", () => {
  assert.equal(mapExternalStatus("TIMED"), "scheduled");
});

test("mapExternalStatus: IN_PLAY → live", () => {
  assert.equal(mapExternalStatus("IN_PLAY"), "live");
});

test("mapExternalStatus: PAUSED → live", () => {
  assert.equal(mapExternalStatus("PAUSED"), "live");
});

test("mapExternalStatus: FINISHED → finished", () => {
  assert.equal(mapExternalStatus("FINISHED"), "finished");
});

test("mapExternalStatus: SUSPENDED → null (skip)", () => {
  assert.equal(mapExternalStatus("SUSPENDED"), null);
});

test("mapExternalStatus: unknown → null", () => {
  assert.equal(mapExternalStatus("WHATEVER"), null);
});

// ─── normalizeTeamCode ──────────────────────────────────────────────

test("normalizeTeamCode: URY (football-data) → URU (código FIFA del seed)", () => {
  assert.equal(normalizeTeamCode("URY"), "URU");
});

test("normalizeTeamCode: códigos coincidentes pasan sin cambios", () => {
  assert.equal(normalizeTeamCode("ARG"), "ARG");
  assert.equal(normalizeTeamCode("MEX"), "MEX");
});

// ─── resolveScore90 ─────────────────────────────────────────────────

test("resolveScore90: duration REGULAR → fullTime", () => {
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "REGULAR",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 1, away: 0 }
    }
  });

  assert.deepEqual(resolveScore90(external), { home: 2, away: 1 });
});

test("resolveScore90: sin duration (campo ausente) → fullTime", () => {
  const external = buildExternalMatch();
  assert.deepEqual(resolveScore90(external), { home: 2, away: 1 });
});

test("resolveScore90: EXTRA_TIME → regularTime, no fullTime", () => {
  // 1-1 a los 90', 2-1 tras prórroga: fullTime acumula la prórroga en v4.
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 0, away: 1 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 1, away: 0 }
    }
  });

  assert.deepEqual(resolveScore90(external), { home: 1, away: 1 });
});

test("resolveScore90: PENALTY_SHOOTOUT → regularTime (fullTime incluye penales en v4)", () => {
  // 1-1 a los 90' y 120', 4-2 en penales: v4 reporta fullTime 5-3.
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 5, away: 3 },
      halfTime: { home: 1, away: 0 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 0, away: 0 },
      penalties: { home: 4, away: 2 }
    }
  });

  assert.deepEqual(resolveScore90(external), { home: 1, away: 1 });
});

test("resolveScore90: duration no REGULAR pero sin regularTime → fallback fullTime", () => {
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 0, away: 0 }
    }
  });

  assert.deepEqual(resolveScore90(external), { home: 2, away: 1 });
});

// ─── findInternalMatch ──────────────────────────────────────────────

test("findInternalMatch: matches by homeTeamId + awayTeamId (TLA)", () => {
  const internal = [
    buildInternalMatch({ matchId: "m_001", homeTeamId: "MEX", awayTeamId: "RSA" }),
    buildInternalMatch({ matchId: "m_002", homeTeamId: "ARG", awayTeamId: "BRA" })
  ];
  const external = buildExternalMatch(); // ARG vs BRA

  const result = findInternalMatch(external, internal);
  assert.equal(result?.matchId, "m_002");
});

test("findInternalMatch: returns null when no match found", () => {
  const internal = [
    buildInternalMatch({ matchId: "m_001", homeTeamId: "MEX", awayTeamId: "RSA" })
  ];
  const external = buildExternalMatch(); // ARG vs BRA

  const result = findInternalMatch(external, internal);
  assert.equal(result, null);
});

test("findInternalMatch: does not match reversed teams (home/away matter)", () => {
  const internal = [
    buildInternalMatch({ matchId: "m_001", homeTeamId: "BRA", awayTeamId: "ARG" })
  ];
  const external = buildExternalMatch(); // ARG (home) vs BRA (away)

  const result = findInternalMatch(external, internal);
  assert.equal(result, null);
});

// ─── needsUpdate ────────────────────────────────────────────────────

test("needsUpdate: true when status changes (scheduled → live)", () => {
  const internal = buildInternalMatch({ status: "scheduled" });
  const external = buildExternalMatch({ status: "IN_PLAY" });

  assert.equal(needsUpdate(internal, external), true);
});

test("needsUpdate: true when scores change", () => {
  const internal = buildInternalMatch({ status: "live", homeScore90: 0, awayScore90: 0 });
  const external = buildExternalMatch({
    status: "IN_PLAY",
    score: { winner: null, fullTime: { home: 1, away: 0 }, halfTime: { home: 0, away: 0 } }
  });

  assert.equal(needsUpdate(internal, external), true);
});

test("needsUpdate: false when nothing changed", () => {
  const internal = buildInternalMatch({ status: "finished", homeScore90: 2, awayScore90: 1 });
  const external = buildExternalMatch({
    status: "FINISHED",
    score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 } }
  });

  assert.equal(needsUpdate(internal, external), false);
});

test("needsUpdate: false for unhandled external status", () => {
  const internal = buildInternalMatch({ status: "scheduled" });
  const external = buildExternalMatch({ status: "CANCELLED" });

  assert.equal(needsUpdate(internal, external), false);
});

test("needsUpdate: compara contra el 90' (regularTime), no contra fullTime con prórroga", () => {
  // El match interno ya tiene el 1-1 de los 90' guardado; el fullTime 2-1
  // de la prórroga no debe gatillar otro update.
  const internal = buildInternalMatch({ status: "finished", homeScore90: 1, awayScore90: 1 });
  const external = buildExternalMatch({
    status: "FINISHED",
    score: {
      winner: "HOME_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 0, away: 0 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 1, away: 0 }
    }
  });

  assert.equal(needsUpdate(internal, external), false);
});

// ─── resolveWinnerTeamId ────────────────────────────────────────────

test("resolveWinnerTeamId: home team wins", () => {
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: { winner: "HOME_TEAM", fullTime: { home: 3, away: 1 }, halfTime: { home: 1, away: 0 } }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), "ARG");
});

test("resolveWinnerTeamId: away team wins", () => {
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: { winner: "AWAY_TEAM", fullTime: { home: 0, away: 2 }, halfTime: { home: 0, away: 1 } }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), "BRA");
});

test("resolveWinnerTeamId: draw with penalty winner (HOME_TEAM, shape real v4)", () => {
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 5, away: 3 },
      halfTime: { home: 0, away: 1 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 0, away: 0 },
      penalties: { home: 4, away: 2 }
    }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), "ARG");
});

test("resolveWinnerTeamId: draw with penalty winner (AWAY_TEAM, shape real v4)", () => {
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: {
      winner: "AWAY_TEAM",
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 5, away: 6 },
      halfTime: { home: 1, away: 1 },
      regularTime: { home: 2, away: 2 },
      extraTime: { home: 0, away: 0 },
      penalties: { home: 3, away: 4 }
    }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), "BRA");
});

test("resolveWinnerTeamId: prórroga sin penales → ganador por score.winner, no por fullTime", () => {
  // 1-1 a los 90', 2-1 tras prórroga: el winnerTeamId sale de score.winner
  // porque el marcador de 90' (regularTime) quedó empatado.
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: {
      winner: "HOME_TEAM",
      duration: "EXTRA_TIME",
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 1, away: 1 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 1, away: 0 }
    }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), "ARG");
});

test("resolveWinnerTeamId: group stage draw → null (no winner)", () => {
  const internal = buildInternalMatch({ homeTeamId: "ARG", awayTeamId: "BRA" });
  const external = buildExternalMatch({
    score: { winner: "DRAW", fullTime: { home: 1, away: 1 }, halfTime: { home: 0, away: 0 } }
  });

  assert.equal(resolveWinnerTeamId(internal, external, "finished"), null);
});

test("resolveWinnerTeamId: not finished → keeps existing winnerTeamId", () => {
  const internal = buildInternalMatch({ winnerTeamId: null });
  const external = buildExternalMatch({ status: "IN_PLAY" });

  assert.equal(resolveWinnerTeamId(internal, external, "live"), null);
});
