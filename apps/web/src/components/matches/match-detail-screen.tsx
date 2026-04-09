"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, StatusTag, TeamDisplay, colors, radii, spacing, typography } from "@prode/ui";
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

function predictionWindowNotOpen(detail: MatchDetail) {
  return detail.status === "scheduled" && !detail.isEditable && new Date(detail.predictionOpensAt).getTime() > Date.now();
}

function toStatusLabel(detail: MatchDetail) {
  if (detail.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (detail.status === "live") {
    return "En vivo";
  }

  if (!detail.isEditable) {
    if (predictionWindowNotOpen(detail)) {
      return "Abre pronto";
    }

    return "Cerrado";
  }

  if (detail.userPrediction) {
    return "Guardado";
  }

  return "Pendiente";
}

function toStatusTone(detail: MatchDetail) {
  if (detail.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (detail.status === "live") {
    return "live" as const;
  }

  if (!detail.isEditable) {
    return "locked" as const;
  }

  return "editable" as const;
}

function toHelperText(detail: MatchDetail, formState: FormState) {
  if (predictionWindowNotOpen(detail)) {
    return `La prediccion abre ${toKickoffLabel(detail.predictionOpensAt)}.`;
  }

  if (detail.requiresQualifierIfDraw && formState.homeScorePred !== "" && formState.homeScorePred === formState.awayScorePred) {
    return "Si eliges empate, marca quien clasifica.";
  }

  return "Toca guardar para confirmar.";
}

function toErrorMessage(error: unknown) {
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
      <div style={{ display: "grid", gap: 14 }}>
        <Card elevated style={{ minHeight: 180 }} />
        <Card elevated style={{ minHeight: 320 }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card elevated style={{ gap: spacing[12] }}>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Partido no disponible</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          {loadErrorMessage ?? "No encontramos el detalle de este partido o todavia no pudimos cargarlo."}
        </p>
        <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Button variant="secondary" onClick={onRetryLoad}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={onBackToMatches}>
            Volver
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {saveNotice ? (
        <div
          style={{
            position: "sticky",
            top: 12,
            zIndex: 20,
            justifySelf: "center",
            padding: "12px 16px",
            borderRadius: radii.pill,
            background: saveNotice.tone === "success" ? "rgba(34, 197, 94, 0.16)" : "rgba(220, 38, 38, 0.14)",
            color: saveNotice.tone === "success" ? "#9BE5B6" : "#F5B4B4",
            border: saveNotice.tone === "success" ? "1px solid rgba(34, 197, 94, 0.24)" : "1px solid rgba(220, 38, 38, 0.22)",
            fontSize: 14,
            lineHeight: 1.35,
            fontWeight: 600
          }}
        >
          {saveNotice.message}
        </div>
      ) : null}

      <Card elevated style={{ gap: 14, padding: 18 }}>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <Link href="/matches" style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary, textDecoration: "none" }}>
            Volver a partidos
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>{toStageLabel(detail)}</span>
            <StatusTag status={toStatusTone(detail)} label={toStatusLabel(detail)} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <TeamDisplay teamName={detail.homeTeam.name} flagUrl={detail.homeTeam.flagUrl} size="lg" weight={700} />
          <div style={{ paddingLeft: 46, fontSize: 12, color: colors.textMuted, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
          <TeamDisplay teamName={detail.awayTeam.name} flagUrl={detail.awayTeam.flagUrl} size="lg" weight={700} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 15, lineHeight: 1.4, color: colors.textPrimary, fontWeight: 600 }}>{toKickoffLabel(detail.kickoffAt)}</span>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
            Deadline: {toKickoffLabel(detail.deadlineAt)}
          </span>
          {predictionWindowNotOpen(detail) ? (
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
              Apertura: {toKickoffLabel(detail.predictionOpensAt)}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gap: spacing[8],
            padding: 14,
            borderRadius: radii.md,
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary }}>
            {predictionWindowNotOpen(detail) ? "Prediccion disponible desde la apertura" : "Editable hasta kickoff"}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
            Exacto: {detail.scoringRules.exact90Points} pts
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
            Signo: {detail.scoringRules.correctOutcome90Points} pts · Clasificado: {detail.scoringRules.correctQualifierPoints} pts
          </span>
        </div>
      </Card>

      <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
        {saveNotice?.tone === "error" ? (
          <div
            style={{
              display: "grid",
              gap: spacing[12],
              padding: 14,
              borderRadius: radii.md,
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.18)"
            }}
          >
            <p style={{ ...typography.body, margin: 0, color: "#F5B4B4" }}>{saveNotice.message}</p>
            <Button variant="secondary" onClick={onSave} disabled={isSaving}>
              Reintentar guardado
            </Button>
          </div>
        ) : null}

        <ScoreInput
          awayLabel={detail.awayTeam.name}
          awayValue={formState.awayScorePred}
          classifierLabel="Quien clasifica"
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
          {detail.userPrediction ? "Actualizar prediccion" : "Guardar prediccion"}
        </Button>
      </Card>

      {detail.officialResult || detail.userPrediction ? (
        <Card elevated style={{ gap: spacing[12], padding: spacing[16] }}>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Resultado y puntos</h2>

          {detail.userPrediction ? (
            <div style={{ display: "grid", gap: spacing[8] }}>
              <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>
                Tu prediccion: {detail.userPrediction.homeScorePred}-{detail.userPrediction.awayScorePred}
              </p>
              <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
                Estado: {detail.userPrediction.status}
                {detail.userPrediction.pointsAwarded !== null ? ` · ${detail.userPrediction.pointsAwarded} pts` : ""}
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
    }, 2200);

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
        message: "Prediccion guardada."
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
