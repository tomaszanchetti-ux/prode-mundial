"use client";

import { useEffect, useState } from "react";
import type { MatchDetail, SaveMatchPredictionInput } from "@prode/shared";
import { PredictionModal, ScoreInput } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMatchDetail, saveMatchPrediction } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, formatDateTime, useLocale, type AppLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";
import { toStatusLabel, toStatusTone } from "./match-detail-helpers";
import { AdvancerSelect, asksAdvancer } from "./advancer-select";
import { MatchResultDetail } from "./match-result-detail";

type QuickPredictionModalProps = {
  matchId: string | null;
  isOpen: boolean;
  hasNextPending?: boolean;
  onClose: () => void;
  onSaved?: () => void;
  // Avanzar al siguiente match pendiente sin guardar. Si no se pasa, el
  // boton secundario cae a "Mas tarde" (onClose).
  onSkip?: () => void;
};

type FormState = {
  homeScorePred: string;
  awayScorePred: string;
  advancesTeamPred: string | null;
};

function toStageLabel(detail: MatchDetail, locale: AppLocale) {
  if (detail.stage === "group" && detail.groupId) {
    return copyForLocale(locale, `Grupo ${detail.groupId}`, `Group ${detail.groupId}`);
  }

  const labelsEs: Record<string, string> = {
    R32: "16vos",
    R16: "Octavos",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  const labelsEn: Record<string, string> = {
    R32: "Round of 32",
    R16: "Round of 16",
    QF: "Quarterfinals",
    SF: "Semifinal",
    BRONZE: "Third place",
    FINAL: "Final"
  };

  const labels = locale === "en" ? labelsEn : labelsEs;
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
    advancesTeamPred: detail.userPrediction?.advancesTeamPred ?? null
  };
}

function toErrorMessage(error: unknown, locale: AppLocale) {
  if (error instanceof ApiClientError) {
    if (error.code === "MATCH_LOCKED") {
      return copyForLocale(locale, "Este partido ya se cerró.", "This match is already closed.");
    }

    if (error.code === "INVALID_SCORE") {
      return copyForLocale(locale, "Ingresá un marcador válido.", "Enter a valid score.");
    }

    if (error.code === "ADVANCER_REQUIRED" || error.code === "INVALID_ADVANCER") {
      return copyForLocale(locale, "Elegí quién pasa de fase.", "Pick who advances.");
    }

    return error.message;
  }

  return error instanceof Error
    ? error.message
    : copyForLocale(locale, "No pudimos guardar tu predicción.", "We couldn't save your prediction.");
}

export function QuickPredictionModal({ matchId, isOpen, hasNextPending = false, onClose, onSaved, onSkip }: QuickPredictionModalProps) {
  const { locale } = useLocale();
  const { status, user } = useAuth();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({
    homeScorePred: "",
    awayScorePred: "",
    advancesTeamPred: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvancerError, setShowAdvancerError] = useState(false);

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

  const isEditable = detail ? canEditPrediction(detail) : false;
  // Cruce/partido ya jugado: mostramos resultado real vs predicción en vez del
  // input de marcador (que no tiene sentido sobre un partido terminado).
  const showResults = Boolean(detail?.officialResult);

  async function handleSave() {
    if (!detail || !user) {
      return;
    }

    const needsAdvancer = asksAdvancer(detail.stage, formState.homeScorePred, formState.awayScorePred);
    if (needsAdvancer && !formState.advancesTeamPred) {
      setShowAdvancerError(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const token = await user.getIdToken();
      const payload: SaveMatchPredictionInput = {
        homeScorePred: Number(formState.homeScorePred),
        awayScorePred: Number(formState.awayScorePred),
        advancesTeamPred: needsAdvancer ? formState.advancesTeamPred : null
      };

      await saveMatchPrediction(token, detail.matchId, payload);
      track("prediction_saved", {
        matchId: detail.matchId,
        stage: detail.stage,
        groupId: detail.groupId ?? null,
        homeTeamId: detail.homeTeam.teamId,
        awayTeamId: detail.awayTeam.teamId
      });
      setIsSaving(false);
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
        onSaved?.();
      }, 320);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, locale));
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
      onSubmit={showResults ? onClose : handleSave}
      closeLabel={copyForLocale(locale, "Mas tarde", "Later")}
      skipLabel={copyForLocale(locale, "Completar despues", "Complete later")}
      onSkip={showResults ? undefined : hasNextPending && onSkip ? onSkip : undefined}
      saveLabel={
        showResults
          ? copyForLocale(locale, "Cerrar", "Close")
          : detail?.userPrediction
            ? hasNextPending
              ? copyForLocale(locale, "Modificar y seguir", "Update & next")
              : copyForLocale(locale, "Modificar", "Update")
            : hasNextPending
              ? copyForLocale(locale, "Guardar y seguir", "Save & next")
              : copyForLocale(locale, "Guardar", "Save")
      }
      saving={isSaving}
      stageLabel={detail ? toStageLabel(detail, locale) : copyForLocale(locale, "Partido", "Match")}
      statusLabel={detail && toStatusTone(detail) !== "saved" ? toStatusLabel(detail, locale) : undefined}
      statusTone={detail && toStatusTone(detail) !== "saved" ? toStatusTone(detail) : undefined}
      title={detail ? `${detail.homeTeam.name} vs ${detail.awayTeam.name}` : copyForLocale(locale, "Tu proximo pendiente", "Your next pending match")}
    >
      {showResults && detail ? (
        <MatchResultDetail detail={detail} locale={locale} />
      ) : (
      <>
      <ScoreInput
        awayLabel={detail?.awayTeam.name ?? "Visitante"}
        awayTeam={detail ? { teamName: detail.awayTeam.name, fifaCode: detail.awayTeam.fifaCode, flagAsset: detail.awayTeam.flagAsset, flagUrl: detail.awayTeam.flagUrl } : undefined}
        awayValue={formState.awayScorePred}
        disabled={isLoading || isSaving || !isEditable}
        error={errorMessage ?? undefined}
        homeLabel={detail?.homeTeam.name ?? "Local"}
        homeTeam={detail ? { teamName: detail.homeTeam.name, fifaCode: detail.homeTeam.fifaCode, flagAsset: detail.homeTeam.flagAsset, flagUrl: detail.homeTeam.flagUrl } : undefined}
        homeValue={formState.homeScorePred}
        justSaved={justSaved}
        onAwayChange={(value) => setFormState((current) => ({ ...current, awayScorePred: value }))}
        onHomeChange={(value) => setFormState((current) => ({ ...current, homeScorePred: value }))}
      />
      {detail && asksAdvancer(detail.stage, formState.homeScorePred, formState.awayScorePred) ? (
        <div className="mt-4">
          <AdvancerSelect
            homeTeam={detail.homeTeam}
            awayTeam={detail.awayTeam}
            value={formState.advancesTeamPred}
            disabled={isLoading || isSaving || !isEditable}
            locale={locale}
            invalid={showAdvancerError && !formState.advancesTeamPred}
            onChange={(teamId) => {
              setShowAdvancerError(false);
              setFormState((current) => ({ ...current, advancesTeamPred: teamId }));
            }}
          />
        </div>
      ) : null}
      </>
      )}
    </PredictionModal>
  );
}
