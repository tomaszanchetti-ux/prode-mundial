"use client";

import { useEffect, useMemo, useState } from "react";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { PredictionModal, ScoreInput } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatchDetail, saveMatchPrediction } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, formatDateTime, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { toStatusLabel, toStatusTone } from "./match-detail-helpers";

type QuickPredictionModalProps = {
  matchId: string | null;
  isOpen: boolean;
  hasNextPending?: boolean;
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
    R32: "16vos",
    R16: "Octavos",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[detail.stage] ?? detail.stage;
}

function toKickoffLabel(detail: MatchDetail) {
  return formatDateTime("es", detail.kickoffAt, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
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

export function QuickPredictionModal({ matchId, isOpen, hasNextPending = false, onClose, onSaved }: QuickPredictionModalProps) {
  const { locale } = useLocale();
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
  const isEditable = detail ? canEditPrediction(detail) : false;

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
      track("prediction_saved", {
        matchId: detail.matchId,
        stage: detail.stage,
        groupId: detail.groupId ?? null,
        homeTeamId: detail.homeTeam.teamId,
        awayTeamId: detail.awayTeam.teamId
      });
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
        fifaCode: detail?.awayTeam.fifaCode ?? null,
        flagAsset: detail?.awayTeam.flagAsset ?? null,
        flagUrl: detail?.awayTeam.flagUrl
      }}
      homeTeam={{
        teamName: detail?.homeTeam.name ?? "Local",
        fifaCode: detail?.homeTeam.fifaCode ?? null,
        flagAsset: detail?.homeTeam.flagAsset ?? null,
        flagUrl: detail?.homeTeam.flagUrl
      }}
      isOpen={isOpen}
      kickoffLabel={detail ? copyForLocale(locale, toKickoffLabel(detail), formatDateTime("en", detail.kickoffAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })) : ""}
      onClose={onClose}
      onSubmit={handleSave}
      closeLabel={hasNextPending ? copyForLocale(locale, "Saltar", "Skip") : copyForLocale(locale, "Mas tarde", "Later")}
      saveLabel={hasNextPending ? copyForLocale(locale, "Guardar y seguir", "Save & next") : detail?.userPrediction ? copyForLocale(locale, "Guardar cambios", "Save changes") : copyForLocale(locale, "Guardar prediccion", "Save prediction")}
      saving={isSaving}
      stageLabel={detail ? (locale === "en" && detail.stage === "group" && detail.groupId ? `Group ${detail.groupId}` : toStageLabel(detail)) : copyForLocale(locale, "Partido", "Match")}
      statusLabel={detail ? toStatusLabel(detail) : undefined}
      statusTone={detail ? toStatusTone(detail) : undefined}
      title={detail ? `${detail.homeTeam.name} vs ${detail.awayTeam.name}` : copyForLocale(locale, "Tu proximo pendiente", "Your next pending match")}
    >
      <ScoreInput
        awayLabel={detail?.awayTeam.name ?? "Visitante"}
        awayTeam={detail ? { teamName: detail.awayTeam.name, fifaCode: detail.awayTeam.fifaCode, flagAsset: detail.awayTeam.flagAsset, flagUrl: detail.awayTeam.flagUrl } : undefined}
        awayValue={formState.awayScorePred}
        classifierLabel="Quien clasifica"
        classifierOptions={classifierOptions}
        classifierValue={formState.predictedQualifierTeamId}
        disabled={isLoading || isSaving || !isEditable}
        error={errorMessage ?? undefined}
        homeLabel={detail?.homeTeam.name ?? "Local"}
        homeTeam={detail ? { teamName: detail.homeTeam.name, fifaCode: detail.homeTeam.fifaCode, flagAsset: detail.homeTeam.flagAsset, flagUrl: detail.homeTeam.flagUrl } : undefined}
        homeValue={formState.homeScorePred}
        onAwayChange={(value) => setFormState((current) => ({ ...current, awayScorePred: value }))}
        onClassifierChange={(value) => setFormState((current) => ({ ...current, predictedQualifierTeamId: value }))}
        onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      />
    </PredictionModal>
  );
}
