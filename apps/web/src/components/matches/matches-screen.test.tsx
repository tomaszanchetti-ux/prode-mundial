import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary, TeamRef } from "@prode/shared";
import { MatchesScreenView } from "./matches-screen";

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

test("MatchesScreenView renders contextual CTA for editable pending matches", () => {
  const html = renderToStaticMarkup(
    createElement(MatchesScreenView, {
      activeFilterKey: "all",
      errorMessage: null,
      isLoading: false,
      items: [buildMatchSummary()],
      onFilterSelect: () => undefined,
      onOpenMatch: () => undefined,
      onOpenQuickPredict: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Partidos/);
  assert.match(html, /Argentina/);
  assert.match(html, /Predecir/);
});

test("MatchesScreenView renders saved editable CTA for saved-filter matches", () => {
  const html = renderToStaticMarkup(
    createElement(MatchesScreenView, {
      activeFilterKey: "saved",
      errorMessage: null,
      isLoading: false,
      items: [
        buildMatchSummary({
          predictionStatus: "saved_editable",
          userPredictionSummary: "2-1",
          ctaLabel: "Editar prediccion"
        })
      ],
      onFilterSelect: () => undefined,
      onOpenMatch: () => undefined,
      onOpenQuickPredict: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Editar prediccion/);
});

test("MatchesScreenView renders empty state when filter has no results", () => {
  const html = renderToStaticMarkup(
    createElement(MatchesScreenView, {
      activeFilterKey: "today",
      errorMessage: null,
      isLoading: false,
      items: [],
      onFilterSelect: () => undefined,
      onOpenMatch: () => undefined,
      onOpenQuickPredict: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /No encontramos cruces para este filtro/);
});
