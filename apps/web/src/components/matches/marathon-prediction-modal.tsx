"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { MatchDetail, MatchSummary, PreTournamentSummary, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, StatusTag, TeamDisplay } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatchDetail, saveMatchPrediction } from "@/lib/api/client";
import { copyForLocale, formatDateTime, useLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

type MarathonPredictionModalProps = {
  isOpen: boolean;
  initialMatchId: string | null;
  matchIds: string[];
  matchesById: Map<string, MatchSummary>;
  preTournamentSummary: PreTournamentSummary | null;
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  homeScorePred: string;
  awayScorePred: string;
  predictedQualifierTeamId: string;
};

type MarathonNotice = {
  tone: "error" | "success";
  message: string;
};

export type MarathonPredictionModalViewProps = {
  currentIndex: number;
  currentSummary: MatchSummary | MatchDetail | null;
  detail: MatchDetail | null;
  formState: FormState;
  helperText: string;
  isLoading: boolean;
  isSaving: boolean;
  nextSummary: MatchSummary | null;
  notice: MarathonNotice | null;
  onAwayChange: (value: string) => void;
  onClassifierChange: (value: string) => void;
  onClose: () => void;
  onHomeChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  progressLabel: string;
  remainingMatches: number;
  totalMatches: number;
};

function toStageLabel(summary: MatchSummary | MatchDetail) {
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

function toKickoffLabel(iso: string) {
  return formatDateTime("es", iso, {
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

function toLoadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return "No encontramos este partido.";
  }

  return error instanceof Error ? error.message : "No pudimos cargar el partido.";
}

function toHelperText(detail: MatchDetail | null, notice: MarathonNotice | null) {
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

export function MarathonPredictionModalView({
  currentIndex,
  currentSummary,
  detail,
  formState,
  helperText,
  isLoading,
  isSaving,
  nextSummary,
  notice,
  onAwayChange,
  onClassifierChange,
  onClose,
  onHomeChange,
  onNext,
  onPrevious,
  onSave,
  progressLabel,
  remainingMatches,
  totalMatches
}: MarathonPredictionModalViewProps) {
  if (!currentSummary) {
    return null;
  }

  const qualifierOptions =
    detail &&
    detail.requiresQualifierIfDraw &&
    formState.homeScorePred !== "" &&
    formState.homeScorePred === formState.awayScorePred
      ? [
          { label: detail.homeTeam.name, value: detail.homeTeam.teamId },
          { label: detail.awayTeam.name, value: detail.awayTeam.teamId }
        ]
      : [];

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < remainingMatches - 1;
  const isEditable = detail ? canEditPrediction(detail) : false;

  const progressPercent =
    totalMatches > 0 ? `${Math.max(4, (Number.parseInt(progressLabel, 10) / totalMatches) * 100)}%` : "0%";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 p-3 flex items-end justify-center z-[55] modal-overlay"
    >
      <Card
        elevated
        className="marathon-modal-bg w-full max-w-[620px] gap-3.5 rounded-t-[28px] rounded-b-lg"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="grid gap-2">
            <span className="typo-small text-text-muted">{toStageLabel(currentSummary)} · MARATHON MODE</span>
            <h2 className="typo-h2 m-0 text-text-primary">
              {currentSummary.homeTeam.name} vs {currentSummary.awayTeam.name}
            </h2>
            <p className="m-0 text-[14px] leading-[1.4] text-text-secondary">{helperText}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="close-btn">
            X
          </button>
        </div>

        <div className="grid gap-3 p-3.5 surface-inset">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="grid gap-1">
              <span className="typo-small text-text-muted">PROGRESO GLOBAL</span>
              <strong className="text-[20px] leading-[1.2] text-text-primary">{progressLabel}</strong>
            </div>
            <StatusTag
              status={isEditable ? "editable" : "locked"}
              label={isEditable ? "Listo para guardar" : "Pendiente en cronologia"}
            />
          </div>

          <div className="marathon-progress-track">
            <div className="marathon-progress-fill" style={{ width: progressPercent }} />
          </div>

          <div className="flex justify-between gap-3 flex-wrap">
            <span className="text-[13px] leading-[1.35] text-text-secondary">
              Paso {currentIndex + 1} de {remainingMatches} pendientes
            </span>
            <span className="text-[13px] leading-[1.35] text-text-secondary">
              Kickoff: {toKickoffLabel(currentSummary.kickoffAt)}
            </span>
          </div>
        </div>

        <div className="marathon-matchup-panel grid gap-3 p-4 rounded-lg">
          <TeamDisplay
            teamName={currentSummary.homeTeam.name}
            fifaCode={currentSummary.homeTeam.fifaCode}
            flagAsset={currentSummary.homeTeam.flagAsset}
            flagUrl={currentSummary.homeTeam.flagUrl}
            size="lg"
            weight={700}
          />
          <span className="typo-small text-text-muted pl-[46px]">VS</span>
          <TeamDisplay
            teamName={currentSummary.awayTeam.name}
            fifaCode={currentSummary.awayTeam.fifaCode}
            flagAsset={currentSummary.awayTeam.flagAsset}
            flagUrl={currentSummary.awayTeam.flagUrl}
            size="lg"
            weight={700}
          />
        </div>

        {notice ? (
          <div
            className={`grid gap-2 p-3 rounded-md ${
              notice.tone === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span className="text-[14px] leading-[1.35]">{notice.message}</span>
          </div>
        ) : null}

        <ScoreInput
          awayLabel={currentSummary.awayTeam.name}
          awayValue={formState.awayScorePred}
          classifierLabel="Quien clasifica"
          classifierOptions={qualifierOptions}
          classifierValue={formState.predictedQualifierTeamId}
          disabled={isLoading || isSaving || !isEditable}
          error={notice?.tone === "error" ? notice.message : undefined}
          homeLabel={currentSummary.homeTeam.name}
          homeValue={formState.homeScorePred}
          onAwayChange={onAwayChange}
          onClassifierChange={onClassifierChange}
          onHomeChange={onHomeChange}
        />

        {nextSummary ? (
          <div className="grid gap-2 p-3 surface-inset">
            <span className="typo-small text-text-muted">SIGUE DESPUES</span>
            <span className="text-[14px] leading-[1.35] text-text-primary font-semibold">
              {nextSummary.homeTeam.name} vs {nextSummary.awayTeam.name}
            </span>
            <span className="text-[13px] leading-[1.35] text-text-secondary">
              {toKickoffLabel(nextSummary.kickoffAt)}
            </span>
          </div>
        ) : null}

        <Button fullWidth onClick={onSave} disabled={!isEditable || isSaving || isLoading} loading={isSaving}>
          {canGoNext ? "Guardar y seguir" : "Guardar prediccion"}
        </Button>

        <div className="grid gap-2 grid-cols-2">
          <Button variant="ghost" onClick={onPrevious} disabled={!canGoPrevious || isSaving}>
            Anterior
          </Button>
          <Button variant="secondary" onClick={onNext} disabled={!canGoNext || isSaving}>
            {nextSummary ? "Saltar por ahora" : "Cerrar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function MarathonPredictionModal({
  isOpen,
  initialMatchId,
  matchIds,
  matchesById,
  preTournamentSummary,
  onClose,
  onSaved
}: MarathonPredictionModalProps) {
  const { locale } = useLocale();
  const { status, user } = useAuth();
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(initialMatchId);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({
    homeScorePred: "",
    awayScorePred: "",
    predictedQualifierTeamId: ""
  });
  const [notice, setNotice] = useState<MarathonNotice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentMatchId(initialMatchId);
      setSavedCount(0);
      setNotice(null);
    }
  }, [initialMatchId, isOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!isOpen || !currentMatchId || status !== "authenticated" || !user) {
        setDetail(null);
        return;
      }

      setIsLoading(true);

      try {
        const token = await user.getIdToken();
        const nextDetail = await getMatchDetail(token, currentMatchId);

        if (!cancelled) {
          setDetail(nextDetail);
          setFormState(toFormState(nextDetail));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({
            tone: "error",
            message: toLoadErrorMessage(error)
          });
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
  }, [currentMatchId, isOpen, status, user]);

  const currentIndex = currentMatchId ? matchIds.indexOf(currentMatchId) : -1;
  const currentSummary = currentMatchId ? matchesById.get(currentMatchId) ?? null : null;
  const summaryForView = currentSummary ?? detail;
  const nextSummary =
    currentIndex >= 0 && currentIndex < matchIds.length - 1 ? matchesById.get(matchIds[currentIndex + 1] ?? "") ?? null : null;
  const totalMatches = preTournamentSummary?.totalMatches ?? 0;
  const completedMatches = preTournamentSummary?.completedMatches ?? 0;
  const progressNumerator = Math.min(completedMatches + savedCount + (currentIndex >= 0 ? 1 : 0), totalMatches);
  const progressLabel = `${progressNumerator}/${totalMatches}`;

  function goToRelativeMatch(offset: -1 | 1) {
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + offset;

    if (nextIndex < 0 || nextIndex >= matchIds.length) {
      return;
    }

    setNotice(null);
    setCurrentMatchId(matchIds[nextIndex] ?? null);
  }

  async function handleSave() {
    if (!detail || !user) {
      return;
    }

    setIsSaving(true);
    setNotice(null);

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

      const hasNextMatch = currentIndex >= 0 && currentIndex < matchIds.length - 1;

      await saveMatchPrediction(token, detail.matchId, payload);
      setSavedCount((current) => current + 1);
      setNotice({
        tone: "success",
        message: hasNextMatch ? "Prediccion guardada. Seguimos con el siguiente partido." : "Prediccion guardada."
      });
      onSaved?.();

      if (hasNextMatch) {
        setCurrentMatchId(matchIds[currentIndex + 1] ?? null);
      } else {
        onClose();
      }
    } catch (error) {
      setNotice({
        tone: "error",
        message: toErrorMessage(error)
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen || !currentMatchId || !summaryForView) {
    return null;
  }

  return (
    <MarathonPredictionModalView
      currentIndex={Math.max(currentIndex, 0)}
      currentSummary={summaryForView}
      detail={detail}
      formState={formState}
      helperText={locale === "en" ? copyForLocale(locale, toHelperText(detail, notice), notice?.tone === "error" ? notice.message : !detail ? "Loading match..." : isPredictionWindowNotOpen(detail) ? `Prediction opens ${formatDateTime("en", detail.predictionOpensAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. You can keep moving through the marathon in the meantime.` : "Save and we'll move straight to the next pending match.") : toHelperText(detail, notice)}
      isLoading={isLoading}
      isSaving={isSaving}
      nextSummary={nextSummary}
      notice={notice}
      onAwayChange={(value) => setFormState((current) => ({ ...current, awayScorePred: value }))}
      onClassifierChange={(value) => setFormState((current) => ({ ...current, predictedQualifierTeamId: value }))}
      onClose={onClose}
      onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      onNext={() => {
        if (nextSummary) {
          goToRelativeMatch(1);
          return;
        }

        onClose();
      }}
      onPrevious={() => goToRelativeMatch(-1)}
      onSave={handleSave}
      progressLabel={progressLabel}
      remainingMatches={matchIds.length}
      totalMatches={totalMatches}
    />
  );
}
