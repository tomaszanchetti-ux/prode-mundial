import type { MatchDetail } from "@prode/shared";
import { ApiClientError } from "@/lib/api/client";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

export type FormState = {
  homeScorePred: string;
  awayScorePred: string;
  predictedQualifierTeamId: string;
};

export type MatchDetailNotice = {
  tone: "error" | "success";
  message: string;
};

export function toFormState(detail: MatchDetail): FormState {
  return {
    homeScorePred: detail.userPrediction ? String(detail.userPrediction.homeScorePred) : "",
    awayScorePred: detail.userPrediction ? String(detail.userPrediction.awayScorePred) : "",
    predictedQualifierTeamId: detail.userPrediction?.predictedQualifierTeamId ?? ""
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

export function toStatusLabel(detail: MatchDetail) {
  if (detail.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (detail.status === "live") {
    return "En vivo";
  }

  if (!canEditPrediction(detail)) {
    if (isPredictionWindowNotOpen(detail)) {
      return "Abre pronto";
    }

    return "Cerrado";
  }

  if (detail.userPrediction) {
    return "Guardado";
  }

  return "Pendiente";
}

export function toStatusTone(detail: MatchDetail) {
  if (detail.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (detail.status === "live") {
    return "live" as const;
  }

  if (!canEditPrediction(detail)) {
    return "locked" as const;
  }

  return "editable" as const;
}

export function toHelperText(detail: MatchDetail, formState: FormState) {
  if (isPredictionWindowNotOpen(detail)) {
    return `La prediccion abre ${toKickoffLabel(detail.predictionOpensAt)}.`;
  }

  if (detail.requiresQualifierIfDraw && formState.homeScorePred !== "" && formState.homeScorePred === formState.awayScorePred) {
    return "Si eliges empate, marca quien clasifica.";
  }

  return "Toca guardar para confirmar.";
}

export function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return "Este partido ya esta bloqueado.";
    }

    if (error.code === "INVALID_SCORE") {
      return "Ingresa un marcador valido.";
    }

    if (error.code === "INVALID_KNOCKOUT_CLASSIFIER") {
      return "Si eliges empate, tienes que marcar quien clasifica.";
    }

    return error.message;
  }

  return error instanceof Error ? error.message : "No pudimos guardar tu prediccion. Intentalo de nuevo.";
}

export function toLoadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return "No encontramos este partido.";
  }

  return error instanceof Error ? error.message : "No pudimos cargar el partido.";
}
