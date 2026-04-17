import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary, PreTournamentSummary, TeamRef } from "@prode/shared";
import { HomeScreenView } from "./home-screen";

function buildTeamRef(teamId: string, name: string): TeamRef {
  return {
    teamId,
    name,
    fifaCode: teamId,
    iso2: null,
    iso3: null,
    flagAsset: "/flags/mock.svg",
    flagUrl: null
  };
}

function buildMatchSummary(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeam: buildTeamRef("ARG", "Argentina"),
    awayTeam: buildTeamRef("BRA", "Brasil"),
    kickoffAt: "2026-06-11T19:00:00Z",
    predictionOpensAt: "2026-06-11T14:00:00.000Z",
    status: "scheduled",
    deadlineAt: "2026-06-11T19:00:00Z",
    isLocked: false,
    isFinished: false,
    isScored: false,
    predictionStatus: "empty",
    userPredictionSummary: null,
    isEditable: true,
    ctaLabel: "Predecir",
    homeScore90: null,
    awayScore90: null,
    ...overrides
  };
}

function buildPreTournamentSummary(overrides: Partial<PreTournamentSummary> = {}): PreTournamentSummary {
  return {
    isPreTournament: true,
    completedMatches: 12,
    totalMatches: 48,
    remainingMatches: 36,
    completionPercentage: 25,
    nextPendingMatchId: "m_001",
    ...overrides
  };
}

test("HomeScreenView renders pre-tournament next-match hero and follow-up CTAs", () => {
  const html = renderToStaticMarkup(
    createElement(HomeScreenView, {
      profileDisplayName: "Tomas",
      items: [buildMatchSummary()],
      leagues: [],
      preTournamentSummary: buildPreTournamentSummary(),
      isLoading: false,
      errorMessage: null,
      onRetry: () => undefined,
      onOpenMatch: () => undefined,
      onOpenMatches: () => undefined,
      onOpenLeagues: () => undefined,
      onOpenRankings: () => undefined,
      onOpenTournament: () => undefined
    })
  );

  assert.match(html, /Grupo A/);
  assert.match(html, /Argentina/);
  assert.match(html, /Brasil/);
  assert.match(html, /TU LIGA HOY/);
  assert.match(html, /Crear liga/);
});

test("HomeScreenView keeps live-tournament priority match card when pre-tournament is inactive", () => {
  const html = renderToStaticMarkup(
    createElement(HomeScreenView, {
      profileDisplayName: "Tomas",
      items: [buildMatchSummary()],
      leagues: [],
      preTournamentSummary: buildPreTournamentSummary({ isPreTournament: false }),
      isLoading: false,
      errorMessage: null,
      onRetry: () => undefined,
      onOpenMatch: () => undefined,
      onOpenMatches: () => undefined,
      onOpenLeagues: () => undefined,
      onOpenRankings: () => undefined,
      onOpenTournament: () => undefined
    })
  );

  assert.match(html, /Grupo A/);
  assert.match(html, /Argentina/);
  assert.match(html, /Brasil/);
  assert.match(html, /Predecir ahora/);
  assert.match(html, /TU LIGA HOY/);
});
