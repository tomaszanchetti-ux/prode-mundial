"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, colors, radii, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatchDetail, saveMatchPrediction } from "@/lib/api/client";

type MatchDetailScreenProps = {
  matchId: string;
};

type FormState = {
  homeScorePred: string;
  awayScorePred: string;
  predictedQualifierTeamId: string;
};

type MatchDetailNotice = {
  tone: "error" | "success";
  message: string;
};

type MatchDetailScreenViewProps = {
  detail: MatchDetail | null;
  formState: FormState;
  isLoading: boolean;
  isSaving: boolean;
  loadErrorMessage: string | null;
  onAwayChange: (value: string) => void;
  onClassifierChange: (value: string) => void;
  onHomeChange: (value: string) => void;
  onRetryLoad: () => void;
  onSave: () => void;
  onBackToMatches: () => void;
  saveNotice: MatchDetailNotice | null;
};

function toFormState(detail: MatchDetail): FormState {
  return {
    homeScorePred: detail.userPrediction ? String(detail.userPrediction.homeScorePred) : "",
    awayScorePred: detail.userPrediction ? String(detail.userPrediction.awayScorePred) : "",
    predictedQualifierTeamId: detail.userPrediction?.predictedQualifierTeamId ?? ""
  };
}

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

function toKickoffLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function toStatusCopy(detail: MatchDetail) {
  if (detail.predictionStatus === "scored") {
    return "Predicción puntuadа";
  }

  if (!detail.isEditable) {
    return "Este partido ya está bloqueado.";
  }

  return "Puedes editar hasta el inicio del partido.";
}

function toHelperText(detail: MatchDetail, formState: FormState) {
  if (detail.requiresQualifierIfDraw && formState.homeScorePred !== "" && formState.homeScorePred === formState.awayScorePred) {
    return "Si predices empate, debes elegir quién clasifica.";
  }

  return "Guardado explícito. No hacemos autoguardado silencioso en el MVP.";
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return "Este partido ya está bloqueado.";
    }

    if (error.code === "INVALID_SCORE") {
      return "Introduce un marcador válido.";
    }

    if (error.code === "INVALID_KNOCKOUT_CLASSIFIER") {
      return "Si predices empate, debes elegir quién clasifica.";
    }

    return error.message;
  }

  return error instanceof Error ? error.message : "No pudimos guardar tu predicción. Inténtalo otra vez.";
}

function toLoadErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 404) {
    return "No encontramos este partido.";
  }

  return error instanceof Error ? error.message : "No pudimos cargar el partido.";
}

export function MatchDetailScreenView({
  detail,
  formState,
  isLoading,
  isSaving,
  loadErrorMessage,
  onAwayChange,
  onClassifierChange,
  onHomeChange,
  onRetryLoad,
  onSave,
  onBackToMatches,
  saveNotice
}: MatchDetailScreenViewProps) {
  const qualifierOptions = useMemo(() => {
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

  if (isLoading) {
    return (
      <div style={{ display: "grid", gap: spacing[16] }}>
        <Card elevated style={{ minHeight: 180 }} />
        <Card elevated style={{ minHeight: 260 }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card elevated style={{ gap: spacing[12] }}>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Partido no disponible</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          {loadErrorMessage ?? "No encontramos el detalle de este partido o todavía no pudimos cargarlo."}
        </p>
        <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Button variant="secondary" onClick={onRetryLoad}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={onBackToMatches}>
            Volver a partidos
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      {saveNotice ? (
        <div
          style={{
            position: "sticky",
            top: 12,
            zIndex: 20,
            justifySelf: "center",
            padding: "12px 16px",
            borderRadius: radii.pill,
            background: saveNotice.tone === "success" ? "rgba(59, 170, 106, 0.16)" : "rgba(209, 73, 91, 0.16)",
            color: saveNotice.tone === "success" ? "#9EE0B8" : "#F2B1BA",
            border: saveNotice.tone === "success" ? "1px solid rgba(59, 170, 106, 0.24)" : "1px solid rgba(209, 73, 91, 0.24)",
            ...typography.body,
            fontWeight: 600
          }}
        >
          {saveNotice.message}
        </div>
      ) : null}

      <Card elevated style={{ gap: spacing[12] }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[12] }}>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <Link href="/matches" style={{ ...typography.small, color: colors.warning500, textDecoration: "none" }}>
              Volver a partidos
            </Link>
            <span style={{ ...typography.small, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {toStageLabel(detail)}
            </span>
            <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>
              {detail.homeTeam.name} vs {detail.awayTeam.name}
            </h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{toKickoffLabel(detail.kickoffAt)}</p>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: radii.md,
              background: detail.isEditable ? "rgba(200, 168, 93, 0.14)" : "rgba(143, 164, 183, 0.14)",
              border: `1px solid ${detail.isEditable ? "rgba(200, 168, 93, 0.3)" : "rgba(143, 164, 183, 0.2)"}`,
              color: detail.isEditable ? "#F3D998" : colors.textSecondary,
              ...typography.small,
              fontWeight: 700
            }}
          >
            {detail.ctaLabel}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: spacing[8],
            padding: spacing[16],
            borderRadius: radii.md,
            background: "linear-gradient(180deg, rgba(7, 19, 31, 0.78) 0%, rgba(10, 24, 38, 0.9) 100%)",
            border: `1px solid ${colors.border}`
          }}
        >
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary, fontWeight: 600 }}>{toStatusCopy(detail)}</p>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Deadline exacto: {toKickoffLabel(detail.deadlineAt)}
          </p>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Scoring: exacto {detail.scoringRules.exact90Points} pts, signo {detail.scoringRules.correctOutcome90Points} pts,
            clasificado {detail.scoringRules.correctQualifierPoints} pts.
          </p>
        </div>
      </Card>

      <Card elevated style={{ gap: spacing[16] }}>
        {saveNotice?.tone === "error" ? (
          <div
            style={{
              display: "grid",
              gap: spacing[12],
              padding: spacing[16],
              borderRadius: radii.md,
              background: "rgba(209, 73, 91, 0.08)",
              border: "1px solid rgba(209, 73, 91, 0.18)"
            }}
          >
            <p style={{ ...typography.body, margin: 0, color: "#F2B1BA" }}>{saveNotice.message}</p>
            <Button variant="secondary" onClick={onSave} disabled={isSaving}>
              Reintentar guardado
            </Button>
          </div>
        ) : null}

        <ScoreInput
          awayLabel={detail.awayTeam.name}
          awayValue={formState.awayScorePred}
          classifierLabel="¿Quién clasifica?"
          classifierOptions={qualifierOptions}
          classifierValue={formState.predictedQualifierTeamId}
          disabled={!detail.isEditable || isSaving}
          error={saveNotice?.tone === "error" ? saveNotice.message : undefined}
          homeLabel={detail.homeTeam.name}
          homeValue={formState.homeScorePred}
          onAwayChange={onAwayChange}
          onClassifierChange={onClassifierChange}
          onHomeChange={onHomeChange}
        />

        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>{toHelperText(detail, formState)}</p>

        <Button
          fullWidth
          disabled={!detail.isEditable || formState.homeScorePred === "" || formState.awayScorePred === ""}
          loading={isSaving}
          onClick={onSave}
        >
          Guardar prediccion
        </Button>
      </Card>

      {detail.officialResult || detail.userPrediction ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Resultado y puntos</h2>

          {detail.userPrediction ? (
            <div style={{ display: "grid", gap: spacing[8] }}>
              <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>
                Tu predicción: {detail.userPrediction.homeScorePred}-{detail.userPrediction.awayScorePred}
                {detail.userPrediction.predictedQualifierTeamId ? ` (${detail.userPrediction.predictedQualifierTeamId})` : ""}
              </p>
              <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
                Estado: {detail.userPrediction.status} {detail.userPrediction.pointsAwarded !== null ? `· ${detail.userPrediction.pointsAwarded} pts` : ""}
              </p>
              {detail.userPrediction.scoringBreakdown ? (
                <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
                  Breakdown: exacto {detail.userPrediction.scoringBreakdown.pointsExact90}, signo {detail.userPrediction.scoringBreakdown.pointsOutcome90},
                  clasificado {detail.userPrediction.scoringBreakdown.pointsQualifier}.
                </p>
              ) : null}
            </div>
          ) : null}

          {detail.officialResult ? (
            <div style={{ display: "grid", gap: spacing[8] }}>
              <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>
                Resultado oficial: {detail.officialResult.homeScore90}-{detail.officialResult.awayScore90}
              </p>
              <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
                Clasificado: {detail.officialResult.qualifiedTeamId ?? "No aplica"}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

export function MatchDetailScreen({ matchId }: MatchDetailScreenProps) {
  const router = useRouter();
  const { status, user } = useAuth();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({
    homeScorePred: "",
    awayScorePred: "",
    predictedQualifierTeamId: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<MatchDetailNotice | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (status !== "authenticated" || !user) {
        setDetail(null);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setLoadErrorMessage(null);
      setDetail(null);

      try {
        const token = await user.getIdToken();
        const nextDetail = await getMatchDetail(token, matchId);

        if (!cancelled) {
          setDetail(nextDetail);
          setFormState(toFormState(nextDetail));
        }
      } catch (error) {
        if (!cancelled) {
          setDetail(null);
          setLoadErrorMessage(toLoadErrorMessage(error));
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
  }, [matchId, reloadKey, status, user]);

  useEffect(() => {
    if (!saveNotice || saveNotice.tone !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveNotice(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [saveNotice]);

  async function handleSave() {
    if (!detail || !user) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);

    try {
      const token = await user.getIdToken();
      const showQualifierSelector =
        detail.requiresQualifierIfDraw &&
        formState.homeScorePred !== "" &&
        formState.homeScorePred === formState.awayScorePred;
      const payload: SaveMatchPredictionInput = {
        homeScorePred: Number(formState.homeScorePred),
        awayScorePred: Number(formState.awayScorePred),
        predictedQualifierTeamId: showQualifierSelector ? formState.predictedQualifierTeamId || null : null
      };

      await saveMatchPrediction(token, detail.matchId, payload);
      const nextDetail = await getMatchDetail(token, detail.matchId);
      setDetail(nextDetail);
      setFormState(toFormState(nextDetail));
      setSaveNotice({
        tone: "success",
        message: "Predicción guardada."
      });
    } catch (error) {
      setSaveNotice({
        tone: "error",
        message: toErrorMessage(error)
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MatchDetailScreenView
      detail={detail}
      formState={formState}
      isLoading={isLoading}
      isSaving={isSaving}
      loadErrorMessage={loadErrorMessage}
      onAwayChange={(value) => setFormState((current) => ({ ...current, awayScorePred: value }))}
      onClassifierChange={(value) => setFormState((current) => ({ ...current, predictedQualifierTeamId: value }))}
      onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      onRetryLoad={() => setReloadKey((current) => current + 1)}
      onSave={handleSave}
      onBackToMatches={() => router.push("/matches")}
      saveNotice={saveNotice}
    />
  );
}
