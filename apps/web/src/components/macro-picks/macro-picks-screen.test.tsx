import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ConfirmMacroAdjustmentInput, MacroPicksResponse, SaveMacroPicksInput } from "@prode/shared";
import { MacroPicksScreenView } from "./macro-picks-screen";
import {
  getMacroAdjustmentValidationMessages,
  getMacroPicksCompletionHint,
  getMacroPicksValidationMessages
} from "./macro-picks-validation";

function buildData(overrides: Partial<MacroPicksResponse> = {}): MacroPicksResponse {
  return {
    status: "draft_editable",
    isLocked: false,
    adjustmentAvailable: false,
    adjustmentAlreadyUsed: false,
    initialDeadlineAt: "2026-06-11T19:00:00Z",
    adjustmentWindow: {
      opensAt: "2026-06-26T19:00:00Z",
      closesAt: "2026-06-28T19:00:00Z"
    },
    groupPicks: {
      A: {
        firstTeamId: "ARG",
        secondTeamId: "MEX"
      }
    },
    finalists: ["ARG", "BRA"],
    champion: "ARG",
    completion: {
      groupsCompleted: 1,
      groupsTotal: 12,
      hasFinalists: true,
      hasChampion: true,
      percent: 21
    },
    ...overrides
  };
}

function buildFormState(): SaveMacroPicksInput {
  return {
    groupPicks: {
      A: {
        firstTeamId: "ARG",
        secondTeamId: "MEX"
      }
    },
    finalists: ["ARG", "BRA"],
    champion: "ARG"
  };
}

function buildAdjustmentState(): ConfirmMacroAdjustmentInput {
  return {
    finalists: ["ARG", "ESP"],
    champion: "ARG"
  };
}

test("MacroPicksScreenView renders editable draft state with save CTA", () => {
  const html = renderToStaticMarkup(
    createElement(MacroPicksScreenView, {
      data: buildData(),
      errorMessage: null,
      formState: buildFormState(),
      adjustmentState: buildAdjustmentState(),
      feedbackMessage: null,
      completionHint: "Todavia te falta definir 11 grupos para cerrar el pick inicial completo.",
      validationMessages: [],
      adjustmentValidationMessages: [],
      isLoading: false,
      isSaving: false,
      isConfirmingAdjustment: false,
      onChangeGroupPick: () => undefined,
      onChangeFinalist: () => undefined,
      onChangeChampion: () => undefined,
      onChangeAdjustmentFinalist: () => undefined,
      onChangeAdjustmentChampion: () => undefined,
      onOpenTournament: () => undefined,
      onRetry: () => undefined,
      onSave: () => undefined,
      onConfirmAdjustment: () => undefined
    })
  );

  assert.match(html, /MACRO PICKS/);
  assert.match(html, /Guardar picks/);
  assert.match(html, /Grupo A/);
  assert.match(html, /Finalista 1/);
  assert.match(html, /Que te falta para cerrarlo/);
});

test("MacroPicksScreenView renders locked original state as readonly summary", () => {
  const html = renderToStaticMarkup(
    createElement(MacroPicksScreenView, {
      data: buildData({ status: "locked_original", isLocked: true }),
      errorMessage: null,
      formState: buildFormState(),
      adjustmentState: buildAdjustmentState(),
      feedbackMessage: null,
      completionHint: "Tu pick inicial ya esta completo y listo para quedar bloqueado al kickoff.",
      validationMessages: [],
      adjustmentValidationMessages: [],
      isLoading: false,
      isSaving: false,
      isConfirmingAdjustment: false,
      onChangeGroupPick: () => undefined,
      onChangeFinalist: () => undefined,
      onChangeChampion: () => undefined,
      onChangeAdjustmentFinalist: () => undefined,
      onChangeAdjustmentChampion: () => undefined,
      onOpenTournament: () => undefined,
      onRetry: () => undefined,
      onSave: () => undefined,
      onConfirmAdjustment: () => undefined
    })
  );

  assert.match(html, /La ventana inicial ya cerro/);
  assert.match(html, /PICKS ORIGINALES/);
  assert.match(html, /Tus picks finales iniciales/);
});

test("MacroPicksScreenView renders adjustment flow when adjustment is available", () => {
  const html = renderToStaticMarkup(
    createElement(MacroPicksScreenView, {
      data: buildData({ status: "adjustment_available", isLocked: true, adjustmentAvailable: true }),
      errorMessage: null,
      formState: buildFormState(),
      adjustmentState: buildAdjustmentState(),
      feedbackMessage: null,
      completionHint: "Tu pick inicial ya esta completo y listo para quedar bloqueado al kickoff.",
      validationMessages: [],
      adjustmentValidationMessages: [],
      isLoading: false,
      isSaving: false,
      isConfirmingAdjustment: false,
      onChangeGroupPick: () => undefined,
      onChangeFinalist: () => undefined,
      onChangeChampion: () => undefined,
      onChangeAdjustmentFinalist: () => undefined,
      onChangeAdjustmentChampion: () => undefined,
      onOpenTournament: () => undefined,
      onRetry: () => undefined,
      onSave: () => undefined,
      onConfirmAdjustment: () => undefined
    })
  );

  assert.match(html, /Confirmar ajuste/);
  assert.match(html, /AJUSTE POST GRUPOS/);
  assert.match(html, /Nuevo finalista 1/);
});

test("getMacroPicksValidationMessages detects duplicate teams and invalid champion", () => {
  const messages = getMacroPicksValidationMessages({
    groupPicks: {
      A: {
        firstTeamId: "ARG",
        secondTeamId: "ARG"
      }
    },
    finalists: ["ARG", "ARG"],
    champion: "BRA"
  });

  assert.deepEqual(messages, [
    "En el grupo A no puedes repetir el mismo equipo en 1° y 2° puesto.",
    "Los dos finalistas deben ser equipos distintos."
  ]);
});

test("getMacroPicksValidationMessages detects champion outside a valid finalist pair", () => {
  const messages = getMacroPicksValidationMessages({
    groupPicks: {},
    finalists: ["ARG", "BRA"],
    champion: "ESP"
  });

  assert.deepEqual(messages, ["El campeon debe estar incluido entre tus dos finalistas."]);
});

test("getMacroAdjustmentValidationMessages requires complete valid adjustment", () => {
  const messages = getMacroAdjustmentValidationMessages({
    finalists: ["ARG", ""],
    champion: "BRA"
  });

  assert.deepEqual(messages, [
    "Para confirmar el ajuste debes elegir dos finalistas.",
    "El campeon ajustado debe coincidir con uno de los finalistas elegidos."
  ]);
});

test("getMacroPicksCompletionHint explains missing pieces", () => {
  assert.equal(
    getMacroPicksCompletionHint(
      buildData({
        completion: {
          groupsCompleted: 10,
          groupsTotal: 12,
          hasFinalists: false,
          hasChampion: false,
          percent: 71
        }
      })
    ),
    "Todavia te falta definir 2 grupos, los 2 finalistas, el campeon para cerrar el pick inicial completo."
  );
});
