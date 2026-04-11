import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary, PreTournamentSummary } from "@prode/shared";
import { HomeScreenView } from "./home-screen";

function buildMatchSummary(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeam: {
      teamId: "ARG",
      name: "Argentina",
      flagUrl: null
    },
    awayTeam: {
      teamId: "BRA",
      name: "Brasil",
      flagUrl: null
    },
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

  assert.match(html, /SEGUIS DESDE ACA/);
  assert.match(html, /Tu proximo pendiente/);
  assert.match(html, /TU LIGA HOY/);
  assert.match(html, /Seguir completando/);
  assert.match(html, /Ir a Tu Mundial/);
  assert.match(html, /Invitar amigos/);
});

test("HomeScreenView keeps live-tournament priority match card when pre-tournament is inactive", () => {
  const html = renderToStaticMarkup(
    createElement(HomeScreenView, {
      profileDisplayName: "Tomas",
      items: [buildMatchSummary()],
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

  assert.match(html, /HOY EN PRODE MUNDIAL/);
  assert.match(html, /TU PROXIMO PENDIENTE/);
  assert.match(html, /Predecir ahora/);
  assert.match(html, /TU MUNDIAL/);
  assert.match(html, /Sigue disponible mientras el torneo ya esta en marcha/);
});
