import type { MatchDetail } from "@prode/shared";
import { ApiClientError } from "@/lib/api/client";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

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

export function toStageLabel(detail: MatchDetail) {
  if (detail.stage === "group" && detail.groupId) {
    return `Grupo ${detail.groupId}`;
  }

  const labels: Record<string, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[detail.stage] ?? detail.stage;
}

export function toKickoffLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
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

export function toStatusLabel(detail: MatchDetail, now = new Date()) {
  if (detail.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (detail.status === "live") {
    return "En vivo";
  }

  if (!canEditPrediction(detail)) {
    if (isPredictionWindowNotOpen(detail, now)) {
      return "Abre pronto";
    }

    return "Cerrado";
  }

  if (detail.userPrediction) {
    return "Guardado";
  }

  if (isClosingSoon(detail.deadlineAt, now)) {
    return "Cierra pronto";
  }

  return "Pendiente";
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

export function toHelperText(detail: MatchDetail, _formState: FormState) {
  if (isPredictionWindowNotOpen(detail)) {
    return `La prediccion abre ${toKickoffLabel(detail.predictionOpensAt)}.`;
  }

  return "";
}

export function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return "Este partido ya esta bloqueado.";
    }

    if (error.code === "INVALID_SCORE") {
      return "Ingresa un marcador valido.";
    }

    return error.message;
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Sin conexion. Revisa tu internet e intentalo de nuevo.";
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "La solicitud tardo demasiado. Intentalo de nuevo.";
  }

  return error instanceof Error ? error.message : "No pudimos guardar tu prediccion. Intentalo de nuevo.";
}

export function toLoadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return "No encontramos este partido.";
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Sin conexion. Revisa tu internet e intentalo de nuevo.";
  }

  return error instanceof Error ? error.message : "No pudimos cargar el partido.";
}
