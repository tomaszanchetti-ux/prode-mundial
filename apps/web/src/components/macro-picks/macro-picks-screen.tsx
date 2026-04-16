"use client";

import React, { useEffect, useState } from "react";
import type {
  ConfirmMacroAdjustmentInput,
  MacroGroupId,
  MacroPicksResponse,
  SaveMacroPicksInput
} from "@prode/shared";
import { APP_ROUTES } from "@prode/shared";
import { Button, Card, ProgressCompact, SkeletonCard, StatusTag } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, confirmMacroAdjustment, getMacroPicks, saveMacroPicks } from "@/lib/api/client";
import { MACRO_GROUPS } from "./macro-picks-data";
import {
  getMacroAdjustmentValidationMessages,
  getMacroPicksCompletionHint,
  getMacroPicksValidationMessages
} from "./macro-picks-validation";
import {
  buildInitialAdjustmentState,
  buildInitialFormState,
  formatDeadline,
  resolveStatusMeta
} from "./macro-picks-helpers";
import { MacroSummaryCard, renderTeamSummary } from "./macro-picks-cards";
import { MacroPicksEditor } from "./macro-picks-editor";
import { MacroPicksAdjustment } from "./macro-picks-adjustment";

type MacroPicksScreenViewProps = {
  data: MacroPicksResponse | null;
  errorMessage: string | null;
  formState: SaveMacroPicksInput;
  adjustmentState: ConfirmMacroAdjustmentInput;
  feedbackMessage: string | null;
  completionHint: string | null;
  validationMessages: string[];
  adjustmentValidationMessages: string[];
  isLoading: boolean;
  isSaving: boolean;
  isConfirmingAdjustment: boolean;
  onChangeGroupPick: (groupId: MacroGroupId, slot: "firstTeamId" | "secondTeamId", value: string) => void;
  onChangeFinalist: (index: 0 | 1, value: string) => void;
  onChangeChampion: (value: string) => void;
  onChangeAdjustmentFinalist: (index: 0 | 1, value: string) => void;
  onChangeAdjustmentChampion: (value: string) => void;
  onOpenTournament: () => void;
  onRetry: () => void;
  onSave: () => void;
  onConfirmAdjustment: () => void;
};

export function MacroPicksScreenView({
  data,
  errorMessage,
  formState,
  adjustmentState,
  feedbackMessage,
  completionHint,
  validationMessages,
  adjustmentValidationMessages,
  isLoading,
  isSaving,
  isConfirmingAdjustment,
  onChangeGroupPick,
  onChangeFinalist,
  onChangeChampion,
  onChangeAdjustmentFinalist,
  onChangeAdjustmentChampion,
  onOpenTournament,
  onRetry,
  onSave,
  onConfirmAdjustment
}: MacroPicksScreenViewProps) {
  const statusMeta = resolveStatusMeta(data?.status ?? "not_started");
  const isEditable = Boolean(
    data && (data.status === "not_started" || data.status === "draft_editable" || data.status === "submitted_editable")
  );
  const canAdjust = data?.status === "adjustment_available";
  const hasValidationErrors = validationMessages.length > 0;

  return (
    <div className="grid gap-4">
      <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
        <div className="flex justify-between gap-3 items-start flex-wrap">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-3">
              <img src="/mundial/wc2026-logo.png" alt="" width={32} height={32} className="opacity-70" />
              <span className="typo-small text-text-muted">MACRO PICKS</span>
            </div>
            <h1 className="typo-h2 m-0 text-text-primary">Tu apuesta larga del torneo</h1>
            <p className="typo-body m-0 text-text-secondary">
              Completa grupos, finalistas y campeon. Guardas cuando quieras y el backend resuelve estados, cierres y elegibilidad del ajuste.
            </p>
          </div>
          <StatusTag status={statusMeta.tone} label={statusMeta.label} />
        </div>

        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{statusMeta.description}</p>

        <div className="flex gap-2.5 flex-wrap">
          <Button variant="ghost" onClick={onOpenTournament}>
            Volver a Tu Mundial
          </Button>
          {isEditable ? (
            <Button onClick={onSave} disabled={isSaving || hasValidationErrors}>
              {isSaving ? "Guardando..." : "Guardar picks"}
            </Button>
          ) : null}
          {canAdjust ? (
            <Button
              onClick={onConfirmAdjustment}
              disabled={isConfirmingAdjustment || adjustmentValidationMessages.length > 0}
            >
              {isConfirmingAdjustment ? "Confirmando..." : "Confirmar ajuste"}
            </Button>
          ) : null}
        </div>
      </Card>

      {data ? (
        <ProgressCompact
          items={[
            {
              label: "GRUPOS",
              value: `${data.completion.groupsCompleted}/${data.completion.groupsTotal}`,
              hint: "grupos completos"
            },
            {
              label: "FINALISTAS",
              value: data.completion.hasFinalists ? "OK" : "Falta",
              hint: "dupla final"
            },
            {
              label: "CAMPEON",
              value: data.completion.hasChampion ? "OK" : "Falta",
              hint: `${data.completion.percent}% total`
            }
          ]}
        />
      ) : null}

      {data ? (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <span className="typo-small text-text-muted">VENTANAS OFICIALES</span>
          <span className="text-[15px] leading-[1.45] text-text-primary">
            Cierre inicial: {formatDeadline(data.initialDeadlineAt)}
          </span>
          <span className="text-[14px] leading-[1.45] text-text-secondary">
            Ajuste: {formatDeadline(data.adjustmentWindow.opensAt)} → {formatDeadline(data.adjustmentWindow.closesAt)}
          </span>
        </Card>
      ) : null}

      {completionHint ? (
        <div className="grid gap-2 p-4 rounded-md alert-warning">
          <strong className="text-[16px]">Que te falta para cerrarlo</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{completionHint}</p>
        </div>
      ) : null}

      {feedbackMessage ? (
        <div className="grid gap-2 p-4 rounded-md alert-info">
          <strong className="text-[16px]">Estado actualizado</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{feedbackMessage}</p>
        </div>
      ) : null}

      {!isLoading && isEditable && hasValidationErrors ? (
        <div className="grid gap-2 p-4 rounded-md alert-warning">
          <strong className="text-[16px]">Revisa estas combinaciones antes de guardar</strong>
          <div className="grid gap-1.5">
            {validationMessages.map((message) => (
              <p key={message} className="m-0 text-[14px] leading-[1.45]">
                {message}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="grid gap-2 p-4 rounded-md alert-error">
          <strong className="text-[16px]">No pudimos cargar o guardar tus macro picks</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {isLoading ? <SkeletonCard lines={3} /> : null}

      {!isLoading && isEditable ? (
        <MacroPicksEditor
          formState={formState}
          isSaving={isSaving}
          onChangeGroupPick={onChangeGroupPick}
          onChangeFinalist={onChangeFinalist}
          onChangeChampion={onChangeChampion}
        />
      ) : null}

      {!isLoading && data && !isEditable ? (
        <>
          <Card elevated style={{ gap: 12, padding: 16 }}>
            <div className="grid gap-1">
              <span className="typo-small text-text-muted">PICKS ORIGINALES</span>
              <strong className="text-[18px] leading-[1.2] text-text-primary">
                {data.status === "adjustment_available" ? "Tu base inicial ya quedo congelada" : "Asi quedaron tus picks iniciales"}
              </strong>
            </div>
            <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {MACRO_GROUPS.map((group) => {
                const groupPick = data.groupPicks[group.groupId];

                return (
                  <div key={group.groupId} className="grid gap-2 p-3 surface-inset">
                    <span className="typo-small text-text-muted">{group.label}</span>
                    {renderTeamSummary(groupPick?.firstTeamId, "1° sin definir")}
                    {renderTeamSummary(groupPick?.secondTeamId, "2° sin definir")}
                  </div>
                );
              })}
            </div>
          </Card>

          <MacroSummaryCard
            title="Original"
            subtitle="Tus picks finales iniciales"
            finalists={data.finalists}
            champion={data.champion}
          />
        </>
      ) : null}

      {!isLoading && canAdjust ? (
        <MacroPicksAdjustment
          adjustmentState={adjustmentState}
          adjustmentValidationMessages={adjustmentValidationMessages}
          isConfirmingAdjustment={isConfirmingAdjustment}
          onChangeAdjustmentFinalist={onChangeAdjustmentFinalist}
          onChangeAdjustmentChampion={onChangeAdjustmentChampion}
        />
      ) : null}

      {!isLoading && data?.status === "adjusted_locked" ? (
        <MacroSummaryCard
          title="Ajuste confirmado"
          subtitle="Tu version final ya quedo cerrada"
          finalists={data.adjustedFinalists ?? []}
          champion={data.adjustedChampion ?? null}
        />
      ) : null}
    </div>
  );
}

export function MacroPicksScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [data, setData] = useState<MacroPicksResponse | null>(null);
  const [formState, setFormState] = useState<SaveMacroPicksInput>(() => buildInitialFormState(null));
  const [adjustmentState, setAdjustmentState] = useState<ConfirmMacroAdjustmentInput>(() =>
    buildInitialAdjustmentState(null)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingAdjustment, setIsConfirmingAdjustment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const validationMessages = getMacroPicksValidationMessages(formState);
  const adjustmentValidationMessages = getMacroAdjustmentValidationMessages(adjustmentState);
  const completionHint = getMacroPicksCompletionHint(data);

  useEffect(() => {
    let cancelled = false;

    async function loadMacroPicks() {
      if (status !== "authenticated" || !user) {
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const nextData = await getMacroPicks(token);

        if (!cancelled) {
          setData(nextData);
          setFormState(buildInitialFormState(nextData));
          setAdjustmentState(buildInitialAdjustmentState(nextData));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No pudimos cargar tus macro picks."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMacroPicks();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  async function handleSave() {
    if (!user) {
      return;
    }

    if (validationMessages.length > 0) {
      setErrorMessage(validationMessages[0]);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await saveMacroPicks(token, formState);
      setFeedbackMessage(
        response.status === "submitted_editable"
          ? "Tus macro picks iniciales quedaron completos y siguen editables hasta el kickoff."
          : `Guardamos tu draft. Ya llevas ${response.completionPercent}% del modulo completo.`
      );
      setReloadKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No pudimos guardar tus macro picks."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmAdjustment() {
    if (!user) {
      return;
    }

    if (adjustmentValidationMessages.length > 0) {
      setErrorMessage(adjustmentValidationMessages[0]);
      return;
    }

    setIsConfirmingAdjustment(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      await confirmMacroAdjustment(token, adjustmentState);
      setFeedbackMessage("El ajuste quedo confirmado. Desde ahora esta bloqueado y cuenta con penalizacion reducida.");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No pudimos confirmar tu ajuste."
      );
    } finally {
      setIsConfirmingAdjustment(false);
    }
  }

  return (
    <MacroPicksScreenView
      data={data}
      errorMessage={errorMessage}
      formState={formState}
      adjustmentState={adjustmentState}
      feedbackMessage={feedbackMessage}
      completionHint={completionHint}
      validationMessages={validationMessages}
      adjustmentValidationMessages={adjustmentValidationMessages}
      isLoading={isLoading}
      isSaving={isSaving}
      isConfirmingAdjustment={isConfirmingAdjustment}
      onChangeGroupPick={(groupId, slot, value) => {
        setFormState((current) => ({
          ...current,
          groupPicks: {
            ...current.groupPicks,
            [groupId]: {
              firstTeamId: slot === "firstTeamId" ? value : current.groupPicks[groupId]?.firstTeamId ?? "",
              secondTeamId: slot === "secondTeamId" ? value : current.groupPicks[groupId]?.secondTeamId ?? ""
            }
          }
        }));
      }}
      onChangeFinalist={(index, value) => {
        setFormState((current) => {
          const finalists = [...current.finalists];
          finalists[index] = value;

          return {
            ...current,
            finalists: finalists.filter((teamId) => Boolean(teamId)),
            champion: current.champion ?? null
          };
        });
      }}
      onChangeChampion={(value) => {
        setFormState((current) => ({
          ...current,
          champion: value || null
        }));
      }}
      onChangeAdjustmentFinalist={(index, value) => {
        setAdjustmentState((current) => {
          const finalists = [...current.finalists];
          finalists[index] = value;

          return {
            ...current,
            finalists: finalists.filter((teamId) => Boolean(teamId))
          };
        });
      }}
      onChangeAdjustmentChampion={(value) => {
        setAdjustmentState((current) => ({
          ...current,
          champion: value
        }));
      }}
      onOpenTournament={() => router.push(APP_ROUTES.tournament)}
      onRetry={() => setReloadKey((current) => current + 1)}
      onSave={() => void handleSave()}
      onConfirmAdjustment={() => void handleConfirmAdjustment()}
    />
  );
}
