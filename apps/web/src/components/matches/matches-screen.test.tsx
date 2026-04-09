import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary } from "@prode/shared";
import { MatchesScreenView } from "./matches-screen";

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

test("MatchesScreenView renders contextual CTA for editable pending matches", () => {
  const html = renderToStaticMarkup(
    createElement(MatchesScreenView, {
      activeFilterKey: "all",
      errorMessage: null,
      isLoading: false,
      items: [buildMatchSummary()],
      onFilterSelect: () => undefined,
      onOpenMatch: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Partidos/);
  assert.match(html, /Argentina/);
  assert.match(html, /Predecir/);
});

test("MatchesScreenView renders saved editable CTA and prediction summary", () => {
  const html = renderToStaticMarkup(
    createElement(MatchesScreenView, {
      activeFilterKey: "all",
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
      onRetry: () => undefined
    })
  );

  assert.match(html, /Editar prediccion/);
  assert.match(html, /2-1/);
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
      onRetry: () => undefined
    })
  );

  assert.match(html, /No hay partidos para este filtro/);
});
