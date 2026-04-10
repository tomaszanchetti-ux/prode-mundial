import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchDetail, MatchSummary } from "@prode/shared";
import { MarathonPredictionModalView } from "./marathon-prediction-modal";

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

function buildMatchDetail(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    ...buildMatchSummary(),
    requiresQualifierIfDraw: false,
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

test("MarathonPredictionModalView renders progress and navigation controls", () => {
  const html = renderToStaticMarkup(
    createElement(MarathonPredictionModalView, {
      currentIndex: 0,
      currentSummary: buildMatchSummary(),
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1",
        predictedQualifierTeamId: ""
      },
      helperText: "Guarda y avanzamos automaticamente al siguiente pendiente.",
      isLoading: false,
      isSaving: false,
      notice: null,
      onAwayChange: () => undefined,
      onClassifierChange: () => undefined,
      onClose: () => undefined,
      onHomeChange: () => undefined,
      onNext: () => undefined,
      onPrevious: () => undefined,
      onSave: () => undefined,
      progressLabel: "13/48",
      remainingMatches: 4,
      totalMatches: 48
    })
  );

  assert.match(html, /MARATHON MODE/);
  assert.match(html, /13\/48/);
  assert.match(html, /Paso 1 de 4 pendientes/);
  assert.match(html, /Guardar y avanzar/);
  assert.match(html, /Siguiente/);
});
