import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { RankingsScreenView } from "./rankings-screen";

const points: PointsResponse = {
  totalPoints: 18,
  macroPoints: 0,
  exactHits: 2,
  correctSigns: 4,
  recentMatches: [
    {
      matchId: "demo_m_001",
      matchLabel: "Argentina vs Brasil",
      stageLabel: "Grupo A",
      points: 6,
      scoredAt: "2026-06-12T21:00:00Z",
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
  ]
};

const leagues: LeagueSummary[] = [
  {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4,
    position: 2,
    userPoints: 18,
    isActive: true,
    inviteCode: "DEMO26",
    inviteLink: "http://localhost:3000/leagues/join?token=demo"
  }
];

const standings: LeagueStandingsResponse = {
  league: {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4
  },
  myStanding: {
    position: 2,
    totalPoints: 18,
    exactHits: 2,
    correctSigns: 4,
    macroPoints: 0
  },
  items: [
    {
      position: 1,
      userId: "usr_2",
      displayName: "Clara",
      totalPoints: 20,
      exactHits: 3,
      correctSigns: 4,
      macroPoints: 0,
      isMe: false,
      isOwner: false
    },
    {
      position: 2,
      userId: "usr_1",
      displayName: "Tomas",
      totalPoints: 18,
      exactHits: 2,
      correctSigns: 4,
      macroPoints: 0,
      isMe: true,
      isOwner: true
    }
  ]
};

test("RankingsScreenView renders points and standings summary", () => {
  const html = renderToStaticMarkup(
    createElement(RankingsScreenView, {
      leagues,
      points,
      standings,
      selectedLeagueId: "lg_1",
      isLoading: false,
      errorMessage: null,
      onSelectLeague: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /18 pts/);
  assert.match(html, /Argentina vs Brasil/);
  assert.match(html, /Liga Demo Madrid/);
  assert.match(html, /Tabla competitiva/);
  assert.match(html, /La punta la marca Clara con 20 pts/);
  assert.match(html, /Tomas/);
  assert.match(html, /tu posicion/);
});
