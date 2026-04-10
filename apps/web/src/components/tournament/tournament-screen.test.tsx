import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PreTournamentSummary, TuMundialGroupCard } from "@prode/shared";
import { TournamentScreenView } from "./tournament-screen";

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

function buildGroup(overrides: Partial<TuMundialGroupCard> = {}): TuMundialGroupCard {
  return {
    groupId: "A",
    groupName: "Grupo A",
    completedMatches: 2,
    totalMatches: 6,
    isComplete: false,
    items: [
      {
        teamId: "MEX",
        teamName: "Mexico",
        flagUrl: null,
        played: 2,
        won: 2,
        drawn: 0,
        lost: 0,
        goalsFor: 4,
        goalsAgainst: 1,
        goalDifference: 3,
        points: 6,
        position: 1,
        isProjectedQualified: true
      },
      {
        teamId: "RSA",
        teamName: "South Africa",
        flagUrl: null,
        played: 2,
        won: 1,
        drawn: 0,
        lost: 1,
        goalsFor: 2,
        goalsAgainst: 3,
        goalDifference: -1,
        points: 3,
        position: 2,
        isProjectedQualified: true
      }
    ],
    ...overrides
  };
}

test("TournamentScreenView renders projected groups and continue CTA", () => {
  const html = renderToStaticMarkup(
    createElement(TournamentScreenView, {
      errorMessage: null,
      groups: [buildGroup()],
      isLoading: false,
      onContinuePredictions: () => undefined,
      onOpenHome: () => undefined,
      onOpenMatches: () => undefined,
      onRetry: () => undefined,
      preTournamentSummary: buildPreTournamentSummary(),
      profileDisplayName: "Tomas"
    })
  );

  assert.match(html, /TU MUNDIAL/);
  assert.match(html, /Continuar mis predicciones/);
  assert.match(html, /Grupo A/);
  assert.match(html, /Mexico/);
  assert.match(html, /Pts/);
});

test("TournamentScreenView keeps Tu Mundial accessible after the app returns to live mode", () => {
  const html = renderToStaticMarkup(
    createElement(TournamentScreenView, {
      errorMessage: null,
      groups: [buildGroup()],
      isLoading: false,
      onContinuePredictions: () => undefined,
      onOpenHome: () => undefined,
      onOpenMatches: () => undefined,
      onRetry: () => undefined,
      preTournamentSummary: buildPreTournamentSummary({ isPreTournament: false }),
      profileDisplayName: "Tomas"
    })
  );

  assert.match(html, /Volver al home en vivo/);
  assert.match(html, /siguen disponibles aunque el producto ya este priorizando el loop diario del torneo en vivo/i);
  assert.match(html, /Grupo A/);
});
