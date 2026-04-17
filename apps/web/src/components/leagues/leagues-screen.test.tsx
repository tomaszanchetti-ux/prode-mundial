import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  LeagueDetail,
  LeagueStandingsResponse,
  LeagueSummary,
  PointsResponse
} from "@prode/shared";
import { LeaguesScreenView } from "./leagues-screen";
import { GLOBAL_LEAGUE_ID } from "./leagues-helpers";

function buildLeague(overrides: Partial<LeagueSummary> = {}): LeagueSummary {
  return {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4,
    position: 2,
    userPoints: 12,
    isActive: true,
    inviteCode: "DEMO26",
    inviteLink: "http://localhost:3000/leagues/join?token=demo",
    ...overrides
  };
}

function buildLeagueDetail(overrides: Partial<LeagueDetail> = {}): LeagueDetail {
  return {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4,
    isActive: true,
    inviteCode: "DEMO26",
    inviteLink: "http://localhost:3000/leagues/join?token=demo",
    membershipRole: "owner",
    myStanding: {
      position: 2,
      totalPoints: 12,
      exactHits: 1,
      correctSigns: 4,
      macroPoints: 0
    },
    ...overrides
  };
}

function buildPoints(overrides: Partial<PointsResponse> = {}): PointsResponse {
  return {
    totalPoints: 14,
    macroPoints: 2,
    exactHits: 1,
    correctSigns: 5,
    matchPoints: 12,
    totals: {
      totalPoints: 14,
      macroPoints: 2,
      exactHits: 1,
      correctSigns: 5,
      matchPoints: 12
    },
    byStage: {
      group: 12,
      R32: 0,
      R16: 0,
      QF: 0,
      SF: 0,
      BRONZE: 0,
      FINAL: 0,
      macro: 2
    },
    recentMatches: [
      {
        matchId: "m_001",
        matchLabel: "Argentina vs Brasil",
        stageLabel: "Grupo A",
        userPredictionSummary: "2-1",
        officialResultSummary: "2-1",
        points: 6,
        scoredAt: "2026-06-11T21:00:00Z",
        breakdown: {
          exact90Hit: true,
          correctOutcome90Hit: true,
          correctQualifierHit: false,
          pointsExact90: 4,
          pointsOutcome90: 2,
          pointsQualifier: 0,
          pointsTotal: 6
        }
      }
    ],
    ...overrides
  };
}

function buildStandings(overrides: Partial<LeagueStandingsResponse> = {}): LeagueStandingsResponse {
  return {
    league: { leagueId: "lg_1", name: "Liga Demo Madrid", memberLimit: 20, membersCount: 4 },
    items: [
      {
        position: 1,
        userId: "u_1",
        displayName: "Ana",
        totalPoints: 20,
        exactHits: 2,
        correctSigns: 6,
        macroPoints: 0,
        isMe: false,
        isOwner: false
      },
      {
        position: 2,
        userId: "u_2",
        displayName: "Tomas",
        totalPoints: 14,
        exactHits: 1,
        correctSigns: 5,
        macroPoints: 2,
        isMe: true,
        isOwner: true
      }
    ],
    myStanding: {
      position: 2,
      totalPoints: 14,
      exactHits: 1,
      correctSigns: 5,
      macroPoints: 2
    },
    ...overrides
  };
}

test("LeaguesScreenView renders synthetic summary and private league list in Global view", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      points: buildPoints(),
      standings: null,
      selectedLeagueId: GLOBAL_LEAGUE_ID,
      mode: null,
      formState: { leagueName: "", inviteCode: "" },
      actionError: null,
      actionMessage: null,
      lastActionLeague: null,
      isLoading: false,
      isSubmitting: false,
      errorMessage: null,
      onChangeMode: () => undefined,
      onFieldChange: () => undefined,
      onCreateLeague: () => undefined,
      onJoinLeague: () => undefined,
      onSelectLeague: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Tus Ligas/);
  assert.match(html, /Global/);
  assert.match(html, /14 pts/);
  assert.match(html, /Liga Demo Madrid/);
  assert.match(html, /Argentina vs Brasil/);
  assert.match(html, /DONDE GANASTE VENTAJA/);
});

test("LeaguesScreenView renders standings table when a private league is selected", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      points: buildPoints(),
      standings: buildStandings(),
      selectedLeagueId: "lg_1",
      mode: null,
      formState: { leagueName: "", inviteCode: "" },
      actionError: null,
      actionMessage: null,
      lastActionLeague: null,
      isLoading: false,
      isSubmitting: false,
      errorMessage: null,
      onChangeMode: () => undefined,
      onFieldChange: () => undefined,
      onCreateLeague: () => undefined,
      onJoinLeague: () => undefined,
      onSelectLeague: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /#2/);
  assert.match(html, /Ana/);
  assert.match(html, /Tomas/);
  assert.match(html, /E1/);
  assert.match(html, /-6 de la punta/);
  assert.match(html, /Invitar/);
  assert.match(html, /Volver a Global/);
  assert.doesNotMatch(html, /TUS LIGAS PRIVADAS/);
});

test("LeaguesScreenView renders create success state", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      points: buildPoints(),
      standings: null,
      selectedLeagueId: GLOBAL_LEAGUE_ID,
      mode: null,
      formState: { leagueName: "", inviteCode: "" },
      actionError: null,
      actionMessage: "Liga creada. Ya tienes codigo e invite link para compartir.",
      lastActionLeague: buildLeagueDetail(),
      isLoading: false,
      isSubmitting: false,
      errorMessage: null,
      onChangeMode: () => undefined,
      onFieldChange: () => undefined,
      onCreateLeague: () => undefined,
      onJoinLeague: () => undefined,
      onSelectLeague: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /ACCION COMPLETADA/);
  assert.match(html, /Liga creada/);
  assert.match(html, /Creador/);
});
