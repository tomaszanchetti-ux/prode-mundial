"use client";

import React, { useEffect, useState } from "react";
import type {
  ConfirmMacroAdjustmentInput,
  MacroGroupId,
  MacroGroupPicks,
  MacroPicksResponse,
  SaveMacroPicksInput
} from "@prode/shared";
import { APP_ROUTES } from "@prode/shared";
import { Button, Card, ProgressCompact, StatusTag, TeamDisplay } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, confirmMacroAdjustment, getMacroPicks, saveMacroPicks } from "@/lib/api/client";
import { MACRO_ALL_TEAMS, MACRO_GROUPS, MACRO_TEAM_BY_ID } from "./macro-picks-data";
import {
  getMacroAdjustmentValidationMessages,
  getMacroPicksCompletionHint,
  getMacroPicksValidationMessages
} from "./macro-picks-validation";

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

function cloneGroupPicks(groupPicks: MacroGroupPicks): MacroGroupPicks {
  return Object.fromEntries(
    Object.entries(groupPicks).map(([groupId, groupPick]) => [
      groupId,
      groupPick
        ? {
            firstTeamId: groupPick.firstTeamId,
            secondTeamId: groupPick.secondTeamId
          }
        : groupPick
    ])
  ) as MacroGroupPicks;
}

function buildInitialFormState(data: MacroPicksResponse | null): SaveMacroPicksInput {
  return {
    groupPicks: cloneGroupPicks(data?.groupPicks ?? {}),
    finalists: data?.finalists ?? [],
    champion: data?.champion ?? null
  };
}

function buildInitialAdjustmentState(data: MacroPicksResponse | null): ConfirmMacroAdjustmentInput {
  return {
    finalists: (data?.adjustedFinalists ?? data?.finalists ?? []).slice(0, 2),
    champion: data?.adjustedChampion ?? data?.champion ?? ""
  };
}

function formatDeadline(value: string | null | undefined) {
  if (!value) {
    return "por definir";
  }

  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function resolveStatusMeta(status: MacroPicksResponse["status"]) {
  switch (status) {
    case "draft_editable":
      return { label: "Draft", tone: "editable" as const, description: "Puedes avanzar por partes y guardar sin cerrar todo." };
    case "submitted_editable":
      return { label: "Guardado", tone: "scored" as const, description: "Tus picks iniciales quedaron completos y todavia pueden cambiar." };
    case "locked_original":
      return { label: "Bloqueado", tone: "locked" as const, description: "La ventana inicial ya cerro. Tus picks originales quedan congelados." };
    case "adjustment_available":
      return { label: "Ajuste abierto", tone: "live" as const, description: "Ya puedes cambiar solo finalistas y campeon antes del primer knockout." };
    case "adjusted_locked":
      return { label: "Ajustado", tone: "scored" as const, description: "El ajuste ya fue confirmado y no se puede volver a tocar." };
    case "fully_scored":
      return { label: "Scored", tone: "scored" as const, description: "El modulo macro ya termino todo su ciclo competitivo." };
    case "not_started":
    default:
      return { label: "Pendiente", tone: "locked" as const, description: "Todavia no empezaste tus picks macro del torneo." };
  }
}

function renderTeamSummary(teamId: string | null | undefined, fallback = "Sin definir") {
  const team = teamId ? MACRO_TEAM_BY_ID.get(teamId) ?? null : null;

  if (!team) {
    return <span className="text-[14px] leading-[1.4] text-text-secondary">{fallback}</span>;
  }

  return (
    <TeamDisplay
      teamName={team.name}
      fifaCode={team.fifaCode}
      flagAsset={team.flagAsset}
      flagUrl={team.flagUrl}
      size="sm"
      weight={600}
    />
  );
}

function GroupPickerCard({
  groupId,
  groupLabel,
  firstTeamId,
  secondTeamId,
  disabled,
  onChange
}: {
  groupId: MacroGroupId;
  groupLabel: string;
  firstTeamId: string;
  secondTeamId: string;
  disabled: boolean;
  onChange: (slot: "firstTeamId" | "secondTeamId", value: string) => void;
}) {
  const group = MACRO_GROUPS.find((item) => item.groupId === groupId);

  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="grid gap-1">
        <span className="typo-small text-text-muted">{groupLabel.toUpperCase()}</span>
        <strong className="text-[18px] leading-[1.2] text-text-primary">Tus clasificados</strong>
      </div>

      <label className="grid gap-2">
        <span className="typo-small text-text-secondary">1° del grupo</span>
        <select
          aria-label={`${groupLabel} primero`}
          disabled={disabled}
          value={firstTeamId}
          onChange={(event) => onChange("firstTeamId", event.target.value)}
          className="select-input"
        >
          <option value="">Selecciona equipo</option>
          {group?.teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="typo-small text-text-secondary">2° del grupo</span>
        <select
          aria-label={`${groupLabel} segundo`}
          disabled={disabled}
          value={secondTeamId}
          onChange={(event) => onChange("secondTeamId", event.target.value)}
          className="select-input"
        >
          <option value="">Selecciona equipo</option>
          {group?.teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}

function MacroSummaryCard({
  title,
  subtitle,
  finalists,
  champion
}: {
  title: string;
  subtitle: string;
  finalists: string[];
  champion: string | null;
}) {
  return (
    <Card elevated style={{ gap: 12, padding: 16 }}>
      <div className="grid gap-1">
        <span className="typo-small text-text-muted">{title.toUpperCase()}</span>
        <strong className="text-[18px] leading-[1.2] text-text-primary">{subtitle}</strong>
      </div>
      <div className="grid gap-2">
        <div className="grid gap-1.5 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-border-default">
          <span className="typo-small text-text-muted">FINALISTA 1</span>
          {renderTeamSummary(finalists[0] ?? null)}
        </div>
        <div className="grid gap-1.5 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-border-default">
          <span className="typo-small text-text-muted">FINALISTA 2</span>
          {renderTeamSummary(finalists[1] ?? null)}
        </div>
        <div className="grid gap-1.5 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-border-default">
          <span className="typo-small text-text-muted">CAMPEON</span>
          {renderTeamSummary(champion)}
        </div>
      </div>
    </Card>
  );
}

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
  const isEditable = Boolean(data && (data.status === "not_started" || data.status === "draft_editable" || data.status === "submitted_editable"));
  const canAdjust = data?.status === "adjustment_available";
  const hasValidationErrors = validationMessages.length > 0;
  const hasAdjustmentValidationErrors = adjustmentValidationMessages.length > 0;

  return (
    <div className="grid gap-4">
      <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
        <div className="flex justify-between gap-3 items-start flex-wrap">
          <div className="grid gap-1.5">
            <span className="typo-small text-text-muted">MACRO PICKS</span>
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
            <Button onClick={onConfirmAdjustment} disabled={isConfirmingAdjustment || hasAdjustmentValidationErrors}>
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
        <Card elevated style={{ gap: 8, padding: 16, borderColor: "rgba(245, 158, 11, 0.24)" }}>
          <strong className="text-[16px] text-text-primary">Que te falta para cerrarlo</strong>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{completionHint}</p>
        </Card>
      ) : null}

      {feedbackMessage ? (
        <Card elevated style={{ gap: 8, padding: 16, borderColor: "rgba(92, 141, 255, 0.28)" }}>
          <strong className="text-[16px] text-text-primary">Estado actualizado</strong>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{feedbackMessage}</p>
        </Card>
      ) : null}

      {!isLoading && isEditable && hasValidationErrors ? (
        <Card elevated style={{ gap: 8, padding: 16, borderColor: "rgba(245, 158, 11, 0.24)" }}>
          <strong className="text-[16px] text-text-primary">Revisa estas combinaciones antes de guardar</strong>
          <div className="grid gap-1.5">
            {validationMessages.map((message) => (
              <p key={message} className="m-0 text-[14px] leading-[1.45] text-text-secondary">
                {message}
              </p>
            ))}
          </div>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card elevated style={{ gap: 8, padding: 16, borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong className="text-[16px] text-text-primary">No pudimos cargar o guardar tus macro picks</strong>
          <p className="m-0 text-[14px] leading-[1.45] text-[#F5B4B4]">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <div className="w-[128px] h-[10px] rounded-full bg-[rgba(148,163,184,0.16)]" />
          <div className="w-[72%] h-[14px] rounded-full bg-[rgba(255,255,255,0.05)]" />
          <div className="w-full h-[88px] rounded-[16px] bg-[rgba(255,255,255,0.03)]" />
        </Card>
      ) : null}

      {!isLoading && isEditable ? (
        <>
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {MACRO_GROUPS.map((group) => {
              const currentPick = formState.groupPicks[group.groupId];

              return (
                <GroupPickerCard
                  key={group.groupId}
                  groupId={group.groupId}
                  groupLabel={group.label}
                  firstTeamId={currentPick?.firstTeamId ?? ""}
                  secondTeamId={currentPick?.secondTeamId ?? ""}
                  disabled={isSaving}
                  onChange={(slot, value) => onChangeGroupPick(group.groupId, slot, value)}
                />
              );
            })}
          </div>

          <Card elevated style={{ gap: 16, padding: 16 }}>
            <div className="grid gap-1">
              <span className="typo-small text-gold">TRAMO FINAL</span>
              <strong className="text-[18px] leading-[1.2] text-text-primary">Finalistas y campeon</strong>
            </div>

            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {[0, 1].map((index) => (
                <label key={index} className="grid gap-2">
                  <span className="typo-small text-text-secondary">Finalista {index + 1}</span>
                  <select
                    aria-label={`Finalista ${index + 1}`}
                    disabled={isSaving}
                    value={formState.finalists[index] ?? ""}
                    onChange={(event) => onChangeFinalist(index as 0 | 1, event.target.value)}
                    className="select-input"
                  >
                    <option value="">Selecciona equipo</option>
                    {MACRO_ALL_TEAMS.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="grid gap-2">
                <span className="typo-small text-text-secondary">Campeon</span>
                <select
                  aria-label="Campeon"
                  disabled={isSaving}
                  value={formState.champion ?? ""}
                  onChange={(event) => onChangeChampion(event.target.value)}
                  className="select-input"
                >
                  <option value="">Selecciona equipo</option>
                  {MACRO_ALL_TEAMS.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>
        </>
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
                  <div
                    key={group.groupId}
                    className="grid gap-2 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-border-default"
                  >
                    <span className="typo-small text-text-muted">{group.label}</span>
                    {renderTeamSummary(groupPick?.firstTeamId, "1° sin definir")}
                    {renderTeamSummary(groupPick?.secondTeamId, "2° sin definir")}
                  </div>
                );
              })}
            </div>
          </Card>

          <MacroSummaryCard title="Original" subtitle="Tus picks finales iniciales" finalists={data.finalists} champion={data.champion} />
        </>
      ) : null}

      {!isLoading && canAdjust ? (
        <Card elevated style={{ gap: 16, padding: 16 }}>
          <div className="grid gap-1.5">
            <span className="typo-small text-primary-500">AJUSTE POST GRUPOS</span>
            <strong className="text-[18px] leading-[1.2] text-text-primary">Ahora solo puedes tocar finalistas y campeon</strong>
            <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
              Este ajuste es unico e irreversible. Los grupos ya no se modifican y el modelo aplica penalizacion reducida en los aciertos finales.
            </p>
          </div>

          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {[0, 1].map((index) => (
              <label key={index} className="grid gap-2">
                <span className="typo-small text-text-secondary">Nuevo finalista {index + 1}</span>
                <select
                  aria-label={`Nuevo finalista ${index + 1}`}
                  disabled={isConfirmingAdjustment}
                  value={adjustmentState.finalists[index] ?? ""}
                  onChange={(event) => onChangeAdjustmentFinalist(index as 0 | 1, event.target.value)}
                  className="select-input"
                >
                  <option value="">Selecciona equipo</option>
                  {MACRO_ALL_TEAMS.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <label className="grid gap-2">
              <span className="typo-small text-text-secondary">Nuevo campeon</span>
              <select
                aria-label="Nuevo campeon"
                disabled={isConfirmingAdjustment}
                value={adjustmentState.champion}
                onChange={(event) => onChangeAdjustmentChampion(event.target.value)}
                className="select-input"
              >
                <option value="">Selecciona equipo</option>
                {MACRO_ALL_TEAMS.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasAdjustmentValidationErrors ? (
            <div className="grid gap-1.5 p-3 rounded-md alert-warning">
              {adjustmentValidationMessages.map((message) => (
                <p key={message} className="m-0 text-[14px] leading-[1.45] text-text-secondary">
                  {message}
                </p>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
              Cuando lo confirmes, esta version queda congelada y reemplaza solo el tramo final del pick original.
            </p>
          )}
        </Card>
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
  const [adjustmentState, setAdjustmentState] = useState<ConfirmMacroAdjustmentInput>(() => buildInitialAdjustmentState(null));
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
          setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos cargar tus macro picks.");
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
      setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos guardar tus macro picks.");
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
        error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos confirmar tu ajuste."
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
