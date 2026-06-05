import type { MatchDetail } from "@prode/shared";
import { ApiClientError } from "@/lib/api/client";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";
import { copyForLocale, toIntlLocale, type AppLocale } from "@/lib/i18n/locale-provider";

export type FormState = {
  homeScorePred: string;
  awayScorePred: string;
};

export type MatchDetailNotice = {
  tone: "error" | "success";
  message: string;
};

export function toFormState(detail: MatchDetail): FormState {
  return {
    homeScorePred: detail.userPrediction ? String(detail.userPrediction.homeScorePred) : "",
    awayScorePred: detail.userPrediction ? String(detail.userPrediction.awayScorePred) : ""
  };
}

export function toStageLabel(detail: MatchDetail, locale: AppLocale) {
  if (detail.stage === "group" && detail.groupId) {
    return copyForLocale(locale, `Grupo ${detail.groupId}`, `Group ${detail.groupId}`);
  }

  const labelsEs: Record<string, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  const labelsEn: Record<string, string> = {
    R32: "Round of 32",
    R16: "Round of 16",
    QF: "Quarterfinals",
    SF: "Semifinal",
    BRONZE: "Third place",
    FINAL: "Final"
  };

  const labels = locale === "en" ? labelsEn : labelsEs;
  return labels[detail.stage] ?? detail.stage;
}

export function toKickoffLabel(iso: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

// WS50: umbral de urgencia para tone "closing-soon" (2h antes del cierre).
const CLOSING_SOON_THRESHOLD_MS = 2 * 60 * 60 * 1000;

function isClosingSoon(deadlineIso: string, now = new Date()) {
  const diffMs = new Date(deadlineIso).getTime() - now.getTime();
  return diffMs > 0 && diffMs <= CLOSING_SOON_THRESHOLD_MS;
}

export function toStatusLabel(detail: MatchDetail, locale: AppLocale, now = new Date()) {
  if (detail.predictionStatus === "scored") {
    return copyForLocale(locale, "Puntuado", "Scored");
  }

  if (detail.status === "live") {
    return copyForLocale(locale, "En vivo", "Live");
  }

  if (!canEditPrediction(detail)) {
    if (isPredictionWindowNotOpen(detail, now)) {
      return copyForLocale(locale, "Abre pronto", "Opens soon");
    }

    return copyForLocale(locale, "Cerrado", "Closed");
  }

  if (detail.userPrediction) {
    return copyForLocale(locale, "Guardado", "Saved");
  }

  if (isClosingSoon(detail.deadlineAt, now)) {
    return copyForLocale(locale, "Cierra pronto", "Closing soon");
  }

  return copyForLocale(locale, "Pendiente", "Pending");
}

export function toStatusTone(detail: MatchDetail, now = new Date()) {
  if (detail.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (detail.status === "live") {
    return "live" as const;
  }

  if (!canEditPrediction(detail)) {
    return "neutral" as const;
  }

  if (detail.userPrediction) {
    return "saved" as const;
  }

  if (isClosingSoon(detail.deadlineAt, now)) {
    return "closing-soon" as const;
  }

  return "editable" as const;
}

export function toHelperText(detail: MatchDetail, _formState: FormState, locale: AppLocale) {
  if (isPredictionWindowNotOpen(detail)) {
    return copyForLocale(
      locale,
      `La predicción abre ${toKickoffLabel(detail.predictionOpensAt, locale)}.`,
      `Predictions open ${toKickoffLabel(detail.predictionOpensAt, locale)}.`
    );
  }

  return "";
}

export function toErrorMessage(error: unknown, locale: AppLocale) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return copyForLocale(locale, "Este partido ya está bloqueado.", "This match is already locked.");
    }

    if (error.code === "INVALID_SCORE") {
      return copyForLocale(locale, "Ingresá un marcador válido.", "Enter a valid score.");
    }

    return error.message;
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return copyForLocale(
      locale,
      "Sin conexión. Revisá tu internet e intentalo de nuevo.",
      "No connection. Check your internet and try again."
    );
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return copyForLocale(
      locale,
      "La solicitud tardó demasiado. Intentalo de nuevo.",
      "The request took too long. Try again."
    );
  }

  return error instanceof Error
    ? error.message
    : copyForLocale(
        locale,
        "No pudimos guardar tu predicción. Intentalo de nuevo.",
        "We couldn't save your prediction. Try again."
      );
}

export function toLoadErrorMessage(error: unknown, locale: AppLocale) {
  if (error instanceof ApiClientError && error.status === 404) {
    return copyForLocale(locale, "No encontramos este partido.", "We couldn't find this match.");
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return copyForLocale(
      locale,
      "Sin conexión. Revisá tu internet e intentalo de nuevo.",
      "No connection. Check your internet and try again."
    );
  }

  return error instanceof Error
    ? error.message
    : copyForLocale(locale, "No pudimos cargar el partido.", "We couldn't load the match.");
}
