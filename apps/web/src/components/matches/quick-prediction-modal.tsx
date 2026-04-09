"use client";

import { useEffect, useMemo, useState } from "react";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { PredictionModal, ScoreInput } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatchDetail, saveMatchPrediction } from "@/lib/api/client";

type QuickPredictionModalProps = {
  matchId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  homeScorePred: string;
  awayScorePred: string;
  predictedQualifierTeamId: string;
};

function toStageLabel(detail: MatchDetail) {
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

function toKickoffLabel(detail: MatchDetail) {
  const kickoff = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(detail.kickoffAt));

  return `${kickoff} · cierra en kickoff`;
}

function toFormState(detail: MatchDetail): FormState {
  return {
    homeScorePred: detail.userPrediction ? String(detail.userPrediction.homeScorePred) : "",
    awayScorePred: detail.userPrediction ? String(detail.userPrediction.awayScorePred) : "",
    predictedQualifierTeamId: detail.userPrediction?.predictedQualifierTeamId ?? ""
  };
}

function toErrorMessage(error: unknown) {
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

export function QuickPredictionModal({ matchId, isOpen, onClose, onSaved }: QuickPredictionModalProps) {
  const { status, user } = useAuth();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({
    homeScorePred: "",
    awayScorePred: "",
    predictedQualifierTeamId: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!isOpen || !matchId || status !== "authenticated" || !user) {
        setDetail(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const nextDetail = await getMatchDetail(token, matchId);

        if (!cancelled) {
          setDetail(nextDetail);
          setFormState(toFormState(nextDetail));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar el partido.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [isOpen, matchId, status, user]);

  const classifierOptions = useMemo(() => {
    if (!detail) {
      return [];
    }

    const shouldShow =
      detail.requiresQualifierIfDraw &&
      formState.homeScorePred !== "" &&
      formState.homeScorePred === formState.awayScorePred;

    if (!shouldShow) {
      return [];
    }

    return [
      { label: detail.homeTeam.name, value: detail.homeTeam.teamId },
      { label: detail.awayTeam.name, value: detail.awayTeam.teamId }
    ];
  }, [detail, formState.awayScorePred, formState.homeScorePred]);

  async function handleSave() {
    if (!detail || !user) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const token = await user.getIdToken();
      const shouldRequireQualifier =
        detail.requiresQualifierIfDraw &&
        formState.homeScorePred !== "" &&
        formState.homeScorePred === formState.awayScorePred;
      const payload: SaveMatchPredictionInput = {
        homeScorePred: Number(formState.homeScorePred),
        awayScorePred: Number(formState.awayScorePred),
        predictedQualifierTeamId: shouldRequireQualifier ? formState.predictedQualifierTeamId || null : null
      };

      await saveMatchPrediction(token, detail.matchId, payload);
      onSaved?.();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PredictionModal
      awayTeam={{
        teamName: detail?.awayTeam.name ?? "Visitante",
        flagUrl: detail?.awayTeam.flagUrl
      }}
      helperText={
        isLoading
          ? "Cargando partido..."
          : errorMessage
            ? errorMessage
            : "Toca guardar para confirmar tu prediccion."
      }
      homeTeam={{
        teamName: detail?.homeTeam.name ?? "Local",
        flagUrl: detail?.homeTeam.flagUrl
      }}
      isOpen={isOpen}
      kickoffLabel={detail ? toKickoffLabel(detail) : "Preparando partido"}
      onClose={onClose}
      onSubmit={handleSave}
      saveLabel={detail?.userPrediction ? "Actualizar prediccion" : "Guardar prediccion"}
      saving={isSaving}
      stageLabel={detail ? toStageLabel(detail) : "Partido"}
      title="Predice en segundos"
    >
      <ScoreInput
        awayLabel={detail?.awayTeam.name ?? "Visitante"}
        awayValue={formState.awayScorePred}
        classifierLabel="Quien clasifica"
        classifierOptions={classifierOptions}
        classifierValue={formState.predictedQualifierTeamId}
        disabled={isLoading || isSaving || !detail?.isEditable}
        error={errorMessage ?? undefined}
        homeLabel={detail?.homeTeam.name ?? "Local"}
        homeValue={formState.homeScorePred}
        onAwayChange={(value) => setFormState((current) => ({ ...current, awayScorePred: value }))}
        onClassifierChange={(value) => setFormState((current) => ({ ...current, predictedQualifierTeamId: value }))}
        onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      />
    </PredictionModal>
  );
}
