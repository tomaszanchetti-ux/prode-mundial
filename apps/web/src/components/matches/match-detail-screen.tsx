"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { Button, Card, ScoreInput, StatusTag, TeamIdentity } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
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
  onHomeChange,
  onRetryLoad,
  onSave,
  saveNotice
}: MatchDetailScreenViewProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

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
        <h1 className="typo-h2 m-0 text-text-primary">{t("Partido no disponible", "Match not available")}</h1>
        <p className="typo-body m-0 text-text-secondary">
          {loadErrorMessage ?? t("No pudimos cargar este partido.", "We couldn't load this match.")}
        </p>
        <div>
          <Button variant="secondary" onClick={onRetryLoad}>
            {t("Reintentar", "Retry")}
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
          <span className="typo-eyebrow">{toStageLabel(detail, locale)}</span>
          <StatusTag status={toStatusTone(detail)} label={toStatusLabel(detail, locale)} />
        </div>

        <div className="grid gap-2.5">
          <TeamIdentity team={detail.homeTeam} size="lg" emphasis="hero" />
          <div className="pl-[46px] text-[12px] text-text-muted font-bold tracking-[0.08em]">VS</div>
          <TeamIdentity team={detail.awayTeam} size="lg" emphasis="hero" />
        </div>

        <div className="grid gap-1.5">
          <span className="text-[15px] leading-[1.4] text-text-primary font-semibold">{toKickoffLabel(detail.kickoffAt, locale)}</span>
          <span className="text-[14px] leading-[1.4] text-text-secondary">
            {t("Cierre", "Deadline")}: {toKickoffLabel(detail.deadlineAt, locale)}
          </span>
          {isPredictionWindowNotOpen(detail) ? (
            <span className="text-[14px] leading-[1.4] text-text-secondary">
              {t("Apertura", "Opens")}: {toKickoffLabel(detail.predictionOpensAt, locale)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 p-[14px] surface-inset">
          <span className="text-[14px] leading-[1.35] text-text-primary">
            {isPredictionWindowNotOpen(detail)
              ? t("Predicción disponible desde la apertura", "Prediction available once the window opens")
              : t("Editable hasta el inicio", "Editable until kickoff")}
          </span>
          <span className="text-[13px] leading-[1.35] text-text-secondary">
            {t("Marcador exacto", "Exact score")}: {detail.scoringRules.exact90Points} pts · {t("Solo resultado", "Outcome only")}: {detail.scoringRules.correctOutcome90Points} pts
          </span>
        </div>
      </Card>

      <Card elevated style={{ gap: 16, padding: 16 }}>
        {saveNotice?.tone === "error" ? (
          <div className="grid gap-3 p-[14px] rounded-md alert-error">
            <p className="typo-body m-0">{saveNotice.message}</p>
            <Button variant="secondary" onClick={onSave} disabled={isSaving}>
              {t("Reintentar guardado", "Retry save")}
            </Button>
          </div>
        ) : null}

        <ScoreInput
          awayLabel={detail.awayTeam.name}
          awayValue={formState.awayScorePred}
          disabled={!canEditPrediction(detail) || isSaving}
          error={saveNotice?.tone === "error" ? saveNotice.message : undefined}
          homeLabel={detail.homeTeam.name}
          homeValue={formState.homeScorePred}
          onAwayChange={onAwayChange}
          onHomeChange={onHomeChange}
        />

        <p className="typo-body m-0 text-text-secondary">{toHelperText(detail, formState, locale)}</p>

        <Button
          fullWidth
          disabled={!canEditPrediction(detail) || formState.homeScorePred === "" || formState.awayScorePred === ""}
          loading={isSaving}
          onClick={onSave}
        >
          {t("Guardar", "Save")}
        </Button>
      </Card>

      {detail.officialResult || detail.userPrediction ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <h2 className="typo-h3 m-0 text-text-primary">{t("Resultado y puntos", "Result and points")}</h2>

          {detail.userPrediction ? (
            <div className="grid gap-2">
              <p className="typo-body m-0 text-text-primary">
                {t("Tu predicción", "Your prediction")}: {detail.userPrediction.homeScorePred}-{detail.userPrediction.awayScorePred}
              </p>
              <p className="typo-body m-0 text-text-secondary">
                {t("Estado", "Status")}: {detail.userPrediction.status}
                {detail.userPrediction.pointsAwarded !== null ? ` · ${detail.userPrediction.pointsAwarded} pts` : ""}
              </p>
              {detail.userPrediction.scoringBreakdown ? (
                <p className="typo-body m-0 text-text-secondary">
                  {t("Desglose", "Breakdown")}: {t("marcador exacto", "exact score")} {detail.userPrediction.scoringBreakdown.pointsExact90} · {t("solo resultado", "outcome only")} {detail.userPrediction.scoringBreakdown.pointsOutcome90}.
                </p>
              ) : null}
            </div>
          ) : null}

          {detail.officialResult ? (
            <div className="grid gap-2">
              <p className="typo-body m-0 text-text-primary">
                {t("Resultado oficial", "Official result")}: {detail.officialResult.homeScore90}-{detail.officialResult.awayScore90}
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
  const { locale } = useLocale();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({
    homeScorePred: "",
    awayScorePred: ""
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
          setLoadErrorMessage(toLoadErrorMessage(error, locale));
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
  }, [matchId, reloadKey, status, user, locale]);

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
      const payload: SaveMatchPredictionInput = {
        homeScorePred: Number(formState.homeScorePred),
        awayScorePred: Number(formState.awayScorePred)
      };

      await saveMatchPrediction(token, detail.matchId, payload);
      const nextDetail = await getMatchDetail(token, detail.matchId);
      setDetail(nextDetail);
      setFormState(toFormState(nextDetail));
      setSaveNotice({
        tone: "success",
        message: copyForLocale(locale, "Predicción guardada.", "Prediction saved.")
      });
    } catch (error) {
      setSaveNotice({
        tone: "error",
        message: toErrorMessage(error, locale)
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
      onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      onRetryLoad={() => setReloadKey((current) => current + 1)}
      onSave={handleSave}
      saveNotice={saveNotice}
    />
  );
}
