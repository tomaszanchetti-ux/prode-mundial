import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PreTournamentSummary, PredictedGroupStandingRow, TuMundialGroupCard } from "@prode/shared";
import { TournamentScreenView } from "./tournament-screen";

function buildProjectedRow(teamId: string, teamName: string, points: number, position: number): PredictedGroupStandingRow {
  return {
    teamId,
    teamName,
    fifaCode: teamId,
    iso2: null,
    iso3: null,
    flagAsset: "/flags/mock.svg",
    flagUrl: null,
    played: 2,
    won: position === 1 ? 2 : 1,
    drawn: 0,
    lost: position === 1 ? 0 : 1,
    goalsFor: position === 1 ? 4 : 2,
    goalsAgainst: position === 1 ? 1 : 3,
    goalDifference: position === 1 ? 3 : -1,
    points,
    position,
    isProjectedQualified: true
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

function buildGroup(overrides: Partial<TuMundialGroupCard> = {}): TuMundialGroupCard {
  return {
    groupId: "A",
    groupName: "Grupo A",
    completedMatches: 2,
    totalMatches: 6,
    isComplete: false,
    items: [
      buildProjectedRow("MEX", "Mexico", 6, 1),
      buildProjectedRow("RSA", "South Africa", 3, 2)
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
      onOpenMacroPicks: () => undefined,
      onOpenMatches: () => undefined,
      onRetry: () => undefined,
      preTournamentSummary: buildPreTournamentSummary(),
      profileDisplayName: "Tomas"
    })
  );

  assert.match(html, /TU MUNDIAL/);
  assert.match(html, /Continuar mis predicciones/);
  assert.match(html, /Abrir Macro Picks/);
  assert.match(html, /Grupo A/);
  assert.match(html, /Asi va quedando la tabla/);
  assert.match(html, /Mexico/);
  assert.match(html, /clasifica/);
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
      onOpenMacroPicks: () => undefined,
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
