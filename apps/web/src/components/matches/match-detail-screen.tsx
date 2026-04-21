"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, StatusTag, TeamIdentity } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { getMatchDetail, saveMatchPrediction } from "@/lib/api/client";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";
import {
  type FormState,
  type MatchDetailNotice,
  toErrorMessage,
  toFormState,
  toHelperText,
  toKickoffLabel,
  toLoadErrorMessage,
  toStageLabel,
  toStatusLabel,
  toStatusTone
} from "./match-detail-helpers";

type MatchDetailScreenProps = {
  matchId: string;
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
  saveNotice: MatchDetailNotice | null;
};

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
      <div className="grid gap-[14px]">
        <Card elevated style={{ minHeight: 180 }} />
        <Card elevated style={{ minHeight: 320 }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card elevated style={{ gap: 12 }}>
        <h1 className="typo-h2 m-0 text-text-primary">Partido no disponible</h1>
        <p className="typo-body m-0 text-text-secondary">
          {loadErrorMessage ?? "No pudimos cargar este partido."}
        </p>
        <div>
          <Button variant="secondary" onClick={onRetryLoad}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-[14px]">
      {saveNotice ? (
        <div className={`toast-base ${saveNotice.tone === "success" ? "toast-success" : "toast-error"}`}>
          {saveNotice.message}
        </div>
      ) : null}

      <Card elevated style={{ gap: 14, padding: 18 }}>
        <div className="flex justify-between gap-3 items-start">
          <span className="typo-small text-text-muted">{toStageLabel(detail)}</span>
          <StatusTag status={toStatusTone(detail)} label={toStatusLabel(detail)} />
        </div>

        <div className="grid gap-2.5">
          <TeamIdentity team={detail.homeTeam} size="lg" emphasis="hero" />
          <div className="pl-[46px] text-[12px] text-text-muted font-bold tracking-[0.08em]">VS</div>
          <TeamIdentity team={detail.awayTeam} size="lg" emphasis="hero" />
        </div>

        <div className="grid gap-1.5">
          <span className="text-[15px] leading-[1.4] text-text-primary font-semibold">{toKickoffLabel(detail.kickoffAt)}</span>
          <span className="text-[14px] leading-[1.4] text-text-secondary">
            Deadline: {toKickoffLabel(detail.deadlineAt)}
          </span>
          {isPredictionWindowNotOpen(detail) ? (
            <span className="text-[14px] leading-[1.4] text-text-secondary">
              Apertura: {toKickoffLabel(detail.predictionOpensAt)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 p-[14px] surface-inset">
          <span className="text-[14px] leading-[1.35] text-text-primary">
            {isPredictionWindowNotOpen(detail) ? "Prediccion disponible desde la apertura" : "Editable hasta kickoff"}
          </span>
          <span className="text-[13px] leading-[1.35] text-text-secondary">
            Exacto: {detail.scoringRules.exact90Points} pts
          </span>
          <span className="text-[13px] leading-[1.35] text-text-secondary">
            Signo: {detail.scoringRules.correctOutcome90Points} pts · Clasificado: {detail.scoringRules.correctQualifierPoints} pts
          </span>
        </div>
      </Card>

      <Card elevated style={{ gap: 16, padding: 16 }}>
        {saveNotice?.tone === "error" ? (
          <div className="grid gap-3 p-[14px] rounded-md alert-error">
            <p className="typo-body m-0">{saveNotice.message}</p>
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
          disabled={!canEditPrediction(detail) || isSaving}
          error={saveNotice?.tone === "error" ? saveNotice.message : undefined}
          homeLabel={detail.homeTeam.name}
          homeValue={formState.homeScorePred}
          onAwayChange={onAwayChange}
          onClassifierChange={onClassifierChange}
          onHomeChange={onHomeChange}
        />

        <p className="typo-body m-0 text-text-secondary">{toHelperText(detail, formState)}</p>

        <Button
          fullWidth
          disabled={!canEditPrediction(detail) || formState.homeScorePred === "" || formState.awayScorePred === ""}
          loading={isSaving}
          onClick={onSave}
        >
          Guardar
        </Button>
      </Card>

      {detail.officialResult || detail.userPrediction ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <h2 className="typo-h3 m-0 text-text-primary">Resultado y puntos</h2>

          {detail.userPrediction ? (
            <div className="grid gap-2">
              <p className="typo-body m-0 text-text-primary">
                Tu prediccion: {detail.userPrediction.homeScorePred}-{detail.userPrediction.awayScorePred}
              </p>
              <p className="typo-body m-0 text-text-secondary">
                Estado: {detail.userPrediction.status}
                {detail.userPrediction.pointsAwarded !== null ? ` · ${detail.userPrediction.pointsAwarded} pts` : ""}
              </p>
              {detail.userPrediction.scoringBreakdown ? (
                <p className="typo-body m-0 text-text-secondary">
                  Breakdown: exacto {detail.userPrediction.scoringBreakdown.pointsExact90}, signo {detail.userPrediction.scoringBreakdown.pointsOutcome90},
                  clasificado {detail.userPrediction.scoringBreakdown.pointsQualifier}.
                </p>
              ) : null}
            </div>
          ) : null}

          {detail.officialResult ? (
            <div className="grid gap-2">
              <p className="typo-body m-0 text-text-primary">
                Resultado oficial: {detail.officialResult.homeScore90}-{detail.officialResult.awayScore90}
              </p>
              <p className="typo-body m-0 text-text-secondary">
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
      saveNotice={saveNotice}
    />
  );
}
