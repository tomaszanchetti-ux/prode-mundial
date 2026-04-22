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
      correctOutcome90Points: 2
    },
    ...overrides
  };
}

test("MatchDetailScreenView accepts knockout draws without needing qualifier (EPIC 24)", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "1",
        awayScorePred: "1"
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
      onAwayChange: () => undefined,
      onHomeChange: () => undefined,
      onRetryLoad: () => undefined,
      onSave: () => undefined,
      saveNotice: null
    })
  );

  assert.doesNotMatch(html, /Quien clasifica/);
  assert.doesNotMatch(html, /quien clasifica/);
  assert.match(html, /Marcador exacto: 5 pts/);
});

test("MatchDetailScreenView renders save success toast", () => {
  const html = renderToStaticMarkup(
    createElement(MatchDetailScreenView, {
      detail: buildMatchDetail(),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1"
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
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
        ctaLabel: "Bloqueado"
      }),
      formState: {
        homeScorePred: "2",
        awayScorePred: "1"
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
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
        awayScorePred: "1"
      },
      isLoading: false,
      isSaving: false,
      loadErrorMessage: null,
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
