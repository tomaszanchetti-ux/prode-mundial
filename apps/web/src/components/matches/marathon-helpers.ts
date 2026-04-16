import type { MatchDetail, MatchSummary } from "@prode/shared";
import { ApiClientError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/i18n/locale-provider";
import { isPredictionWindowNotOpen } from "@/lib/matches/editability";

export type MarathonFormState = {
  homeScorePred: string;
  awayScorePred: string;
  predictedQualifierTeamId: string;
};

export type MarathonNotice = {
  tone: "error" | "success";
  message: string;
};

export function toStageLabel(summary: MatchSummary | MatchDetail) {
  if (summary.stage === "group" && summary.groupId) {
    return `Grupo ${summary.groupId}`;
  }

  const labels: Record<string, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[summary.stage] ?? summary.stage;
}

export function toKickoffLabel(iso: string) {
  return formatDateTime("es", iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function toFormState(detail: MatchDetail): MarathonFormState {
  return {
    homeScorePred: detail.userPrediction ? String(detail.userPrediction.homeScorePred) : "",
    awayScorePred: detail.userPrediction ? String(detail.userPrediction.awayScorePred) : "",
    predictedQualifierTeamId: detail.userPrediction?.predictedQualifierTeamId ?? ""
  };
}

export function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return "Este partido ya se cerro.";
    }

    if (error.code === "INVALID_SCORE") {
      return "Ingresa un marcador valido.";
    }

    if (error.code === "INVALID_KNOCKOUT_CLASSIFIER") {
      return "Si eliges empate, tienes que marcar quien clasifica.";
    }

    return error.message;
  }

  return error instanceof Error ? error.message : "No pudimos guardar tu prediccion.";
}

export function toLoadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return "No encontramos este partido.";
  }

  return error instanceof Error ? error.message : "No pudimos cargar el partido.";
}

export function toHelperText(detail: MatchDetail | null, notice: MarathonNotice | null) {
  if (notice?.tone === "error") {
    return notice.message;
  }

  if (!detail) {
    return "Cargando partido...";
  }

  if (isPredictionWindowNotOpen(detail)) {
    return `La prediccion abre ${toKickoffLabel(detail.predictionOpensAt)}. Puedes seguir navegando la maraton mientras tanto.`;
  }

  return "Guarda este marcador y seguimos con el proximo pendiente.";
}
