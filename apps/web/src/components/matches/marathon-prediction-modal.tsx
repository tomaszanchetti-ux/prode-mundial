"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { MatchDetail, MatchSummary, PreTournamentSummary, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, StatusTag, TeamDisplay, colors, radii, spacing, typography } from "@prode/ui";
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

  return "Guarda y avanzamos automaticamente al siguiente pendiente.";
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        padding: spacing[12],
        background: colors.overlay,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
        zIndex: 55
      }}
    >
      <Card
        elevated
        style={{
          width: "min(100%, 620px)",
          gap: spacing[16],
          boxShadow: "0 30px 70px rgba(5, 10, 20, 0.5)",
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderBottomLeftRadius: radii.lg,
          borderBottomRightRadius: radii.lg,
          background:
            "radial-gradient(circle at top right, rgba(255, 196, 76, 0.14), transparent 24%), radial-gradient(circle at left center, rgba(47, 107, 255, 0.18), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.99) 0%, rgba(10, 21, 35, 0.99) 100%)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[12] }}>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>{toStageLabel(currentSummary)} · MARATHON MODE</span>
            <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Completa tus grupos sin cortar el ritmo</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{helperText}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.pill,
              border: `1px solid ${colors.border}`,
              background: "rgba(255, 255, 255, 0.03)",
              color: colors.textSecondary,
              cursor: "pointer"
            }}
          >
            X
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: spacing[12],
            padding: spacing[16],
            borderRadius: radii.lg,
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing[12], flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>PROGRESO GLOBAL</span>
              <strong style={{ fontSize: 20, lineHeight: 1.2, color: colors.textPrimary }}>{progressLabel}</strong>
            </div>
            <StatusTag
              status={isEditable ? "editable" : "locked"}
              label={isEditable ? "Listo para guardar" : "Pendiente en cronologia"}
            />
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: radii.pill,
              background: "rgba(255, 255, 255, 0.06)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: totalMatches > 0 ? `${Math.max(4, (Number.parseInt(progressLabel, 10) / totalMatches) * 100)}%` : "0%",
                height: "100%",
                background: "linear-gradient(90deg, rgba(47, 107, 255, 1) 0%, rgba(255, 196, 76, 1) 100%)"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              Paso {currentIndex + 1} de {remainingMatches} pendientes
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              Kickoff: {toKickoffLabel(currentSummary.kickoffAt)}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: spacing[12],
            padding: spacing[16],
            borderRadius: radii.lg,
            background: "linear-gradient(180deg, rgba(7, 17, 31, 1) 0%, rgba(13, 25, 43, 1) 100%)",
            border: `1px solid ${colors.border}`
          }}
        >
          <TeamDisplay teamName={currentSummary.homeTeam.name} flagUrl={currentSummary.homeTeam.flagUrl} size="lg" weight={700} />
          <span style={{ ...typography.small, color: colors.textMuted, paddingLeft: 46 }}>VS</span>
          <TeamDisplay teamName={currentSummary.awayTeam.name} flagUrl={currentSummary.awayTeam.flagUrl} size="lg" weight={700} />
        </div>

        {notice ? (
          <div
            style={{
              display: "grid",
              gap: spacing[8],
              padding: spacing[12],
              borderRadius: radii.md,
              background: notice.tone === "success" ? "rgba(34, 197, 94, 0.12)" : "rgba(220, 38, 38, 0.12)",
              border:
                notice.tone === "success"
                  ? "1px solid rgba(34, 197, 94, 0.24)"
                  : "1px solid rgba(220, 38, 38, 0.22)"
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.35, color: notice.tone === "success" ? "#9BE5B6" : "#F5B4B4" }}>
              {notice.message}
            </span>
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
          <div
            style={{
              display: "grid",
              gap: spacing[8],
              padding: spacing[12],
              borderRadius: radii.md,
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${colors.border}`
            }}
          >
            <span style={{ ...typography.small, color: colors.textMuted }}>SIGUE DESPUES</span>
            <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
              {nextSummary.homeTeam.name} vs {nextSummary.awayTeam.name}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
              {toKickoffLabel(nextSummary.kickoffAt)}
            </span>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <Button variant="ghost" onClick={onPrevious} disabled={!canGoPrevious || isSaving}>
            Anterior
          </Button>
          <Button variant="secondary" onClick={onNext} disabled={!canGoNext || isSaving}>
            Siguiente
          </Button>
          <Button onClick={onSave} disabled={!isEditable || isSaving || isLoading} loading={isSaving}>
            {canGoNext ? "Guardar y seguir" : "Guardar prediccion"}
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

      await saveMatchPrediction(token, detail.matchId, payload);
      setSavedCount((current) => current + 1);
      setNotice({
        tone: "success",
        message: "Prediccion guardada. Seguimos con el siguiente partido."
      });
      onSaved?.();

      if (currentIndex >= 0 && currentIndex < matchIds.length - 1) {
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
      onNext={() => goToRelativeMatch(1)}
      onPrevious={() => goToRelativeMatch(-1)}
      onSave={handleSave}
      progressLabel={progressLabel}
      remainingMatches={matchIds.length}
      totalMatches={totalMatches}
    />
  );
}
