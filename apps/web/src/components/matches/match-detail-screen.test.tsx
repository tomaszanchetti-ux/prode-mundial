import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchDetail, TeamRef } from "@prode/shared";
import { MatchDetailScreenView } from "./match-detail-screen";

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

function buildMatchDetail(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    matchId: "m_073",
    stage: "R32",
    groupId: null,
    homeTeam: buildTeamRef("ARG", "Argentina"),
    awayTeam: buildTeamRef("BRA", "Brasil"),
    kickoffAt: "2026-06-27T19:00:00Z",
    predictionOpensAt: "2026-06-27T14:00:00.000Z",
    status: "scheduled",
    deadlineAt: "2026-06-27T19:00:00Z",
    isLocked: false,
    isFinished: false,
    isScored: false,
    predictionStatus: "empty",
    userPredictionSummary: null,
    userPredictionPoints: null,
    isEditable: true,
    ctaLabel: "Predecir",
    homeScore90: null,
    awayScore90: null,
    officialMatchNumber: null,
    homeSlot: null,
    awaySlot: null,
    winnerTeamId: null,
    officialResult: null,
    userPrediction: null,
    scoringRules: {
      exact90Points: 5,
      correctOutcome90Points: 2,
      penaltyWinnerPoints: 1
    },
    ...overrides
  };
}

test("MatchDetailScreenView shows the advancer selector on a knockout draw", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "1",
        awayScorePred: "1",
        advancesTeamPred: null
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      advancerError: false,
      onAdvancerChange: () => undefined,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: null
    })
  );

  assert.match(html, /Quién pasa a la siguiente ronda/);
  assert.match(html, /1 punto extra/);
  assert.match(html, /Marcador exacto: 5 pts/);
});

test("MatchDetailScreenView hides the advancer selector on a knockout non-draw", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        advancesTeamPred: null
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      advancerError: false,
      onAdvancerChange: () => undefined,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: null
    })
  );

  assert.doesNotMatch(html, /Quién pasa a la siguiente ronda/);
});

test("MatchDetailScreenView renders save success toast", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        advancesTeamPred: null
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      advancerError: false,
      onAdvancerChange: () => undefined,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: {
        tone: "success",
        message: "Predicción guardada."
      }
    })
  );

  assert.match(html, /Predicción guardada\./);
});

test("MatchDetailScreenView renders locked state copy and disables editing intent", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail({
        isEditable: false,
        isLocked: true,
        predictionStatus: "locked_unscored",
        ctaLabel: "Bloqueado",
        // "Abre pronto" requires the prediction window to still be in the
        // future. Keep this relative to now so the test does not rot once the
        // hard-coded fixture dates fall into the past.
        predictionOpensAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        advancesTeamPred: null
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      advancerError: false,
      onAdvancerChange: () => undefined,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: null
    })
  );

  assert.match(html, /Abre pronto/);
  assert.match(html, />Guardar</);
});

test("MatchDetailScreenView renders retry save UI on actionable error", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "1",
        awayScorePred: "1",
        advancesTeamPred: "ARG"
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      advancerError: false,
      onAdvancerChange: () => undefined,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: {
        tone: "error",
        message: "Ingresa un marcador válido."
      }
    })
  );

  assert.match(html, /Reintentar guardado/);
  assert.match(html, /Ingresa un marcador válido\./);
});
