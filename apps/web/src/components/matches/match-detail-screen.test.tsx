import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchDetail } from "@prode/shared";
import { MatchDetailScreenView } from "./match-detail-screen";

function buildMatchDetail(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    matchId: "m_073",
    stage: "R32",
    groupId: null,
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
    kickoffAt: "2026-06-27T19:00:00Z",
    status: "scheduled",
    deadlineAt: "2026-06-27T19:00:00Z",
    isLocked: false,
    isFinished: false,
    isScored: false,
    predictionStatus: "empty",
    userPredictionSummary: null,
    isEditable: true,
    ctaLabel: "Predecir",
    requiresQualifierIfDraw: true,
    officialResult: null,
    userPrediction: null,
    scoringRules: {
      exact90Points: 4,
      correctOutcome90Points: 2,
      correctQualifierPoints: 2
    },
    ...overrides
  };
}

test("MatchDetailScreenView renders qualifier selector only on knockout draw", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "1",
        awayScorePred: "1",
        predictedQualifierTeamId: ""
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      onAwayChange: () => undefined,
      onClassifierChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      onBackToMatches: () => undefined,
      saveNotice: null
    })
  );

  assert.match(html, /Quien clasifica/);
  assert.match(html, /Si eliges empate, marca quien clasifica\./);
});

test("MatchDetailScreenView renders save success toast", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        predictedQualifierTeamId: ""
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      onAwayChange: () => undefined,
      onClassifierChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      onBackToMatches: () => undefined,
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
        ctaLabel: "Bloqueado"
      }),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        predictedQualifierTeamId: ""
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      onAwayChange: () => undefined,
      onClassifierChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      onBackToMatches: () => undefined,
      saveNotice: null
    })
  );

  assert.match(html, /Cerrado/);
  assert.match(html, /Guardar prediccion/);
});

test("MatchDetailScreenView renders retry save UI on actionable error", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "1",
        awayScorePred: "1",
        predictedQualifierTeamId: ""
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      onAwayChange: () => undefined,
      onClassifierChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      onBackToMatches: () => undefined,
      saveNotice: {
        tone: "error",
        message: "Si predices empate, debes elegir quién clasifica."
      }
    })
  );

  assert.match(html, /Reintentar guardado/);
  assert.match(html, /Si predices empate, debes elegir quién clasifica\./);
});
