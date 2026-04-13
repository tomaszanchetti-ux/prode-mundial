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
import { Button, Card, ProgressCompact, StatusTag, TeamDisplay, colors, radii, spacing, typography } from "@prode/ui";
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

const selectStyle = {
  minHeight: 48,
  borderRadius: radii.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgMuted,
  color: colors.textPrimary,
  padding: "0 14px",
  fontSize: 15,
  outline: "none"
} satisfies React.CSSProperties;

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
    return <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{fallback}</span>;
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
    <Card elevated style={{ gap: spacing[12], padding: spacing[16] }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>{groupLabel.toUpperCase()}</span>
        <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>Tus clasificados</strong>
      </div>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ ...typography.small, color: colors.textSecondary }}>1° del grupo</span>
        <select
          aria-label={`${groupLabel} primero`}
          disabled={disabled}
          value={firstTeamId}
          onChange={(event) => onChange("firstTeamId", event.target.value)}
          style={selectStyle}
        >
          <option value="">Selecciona equipo</option>
          {group?.teams.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ ...typography.small, color: colors.textSecondary }}>2° del grupo</span>
        <select
          aria-label={`${groupLabel} segundo`}
          disabled={disabled}
          value={secondTeamId}
          onChange={(event) => onChange("secondTeamId", event.target.value)}
          style={selectStyle}
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
    <Card elevated style={{ gap: spacing[12], padding: spacing[16] }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>{title.toUpperCase()}</span>
        <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>{subtitle}</strong>
      </div>
      <div style={{ display: "grid", gap: spacing[8] }}>
        <div style={{ display: "grid", gap: 6, padding: spacing[12], borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>FINALISTA 1</span>
          {renderTeamSummary(finalists[0] ?? null)}
        </div>
        <div style={{ display: "grid", gap: 6, padding: spacing[12], borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>FINALISTA 2</span>
          {renderTeamSummary(finalists[1] ?? null)}
        </div>
        <div style={{ display: "grid", gap: 6, padding: spacing[12], borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>CAMPEON</span>
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
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card
        elevated
        style={{
          gap: spacing[12],
          padding: spacing[20],
          background:
            "radial-gradient(circle at top right, rgba(255, 196, 76, 0.16), transparent 28%), radial-gradient(circle at left center, rgba(47, 107, 255, 0.18), transparent 32%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>MACRO PICKS</span>
            <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tu apuesta larga del torneo</h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Completa grupos, finalistas y campeon. Guardas cuando quieras y el backend resuelve estados, cierres y elegibilidad del ajuste.
            </p>
          </div>
          <StatusTag status={statusMeta.tone} label={statusMeta.label} />
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{statusMeta.description}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
        <Card elevated style={{ gap: spacing[10], padding: spacing[16] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>VENTANAS OFICIALES</span>
          <span style={{ fontSize: 15, lineHeight: 1.45, color: colors.textPrimary }}>
            Cierre inicial: {formatDeadline(data.initialDeadlineAt)}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
            Ajuste: {formatDeadline(data.adjustmentWindow.opensAt)} → {formatDeadline(data.adjustmentWindow.closesAt)}
          </span>
        </Card>
      ) : null}

      {completionHint ? (
        <Card elevated style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(245, 158, 11, 0.24)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>Que te falta para cerrarlo</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{completionHint}</p>
        </Card>
      ) : null}

      {feedbackMessage ? (
        <Card elevated style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(92, 141, 255, 0.28)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>Estado actualizado</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{feedbackMessage}</p>
        </Card>
      ) : null}

      {!isLoading && isEditable && hasValidationErrors ? (
        <Card elevated style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(245, 158, 11, 0.24)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>Revisa estas combinaciones antes de guardar</strong>
          <div style={{ display: "grid", gap: 6 }}>
            {validationMessages.map((message) => (
              <p key={message} style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
                {message}
              </p>
            ))}
          </div>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[8], padding: spacing[16], borderColor: "rgba(220, 38, 38, 0.26)" }}>
          <strong style={{ fontSize: 16, color: colors.textPrimary }}>No pudimos cargar o guardar tus macro picks</strong>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#F5B4B4" }}>{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: spacing[10], padding: spacing[16] }}>
          <div style={{ width: 128, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "72%", height: 14, borderRadius: 999, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ width: "100%", height: 88, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
        </Card>
      ) : null}

      {!isLoading && isEditable ? (
        <>
          <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
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

          <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.gold500 }}>TRAMO FINAL</span>
              <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>Finalistas y campeon</strong>
            </div>

            <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {[0, 1].map((index) => (
                <label key={index} style={{ display: "grid", gap: 8 }}>
                  <span style={{ ...typography.small, color: colors.textSecondary }}>Finalista {index + 1}</span>
                  <select
                    aria-label={`Finalista ${index + 1}`}
                    disabled={isSaving}
                    value={formState.finalists[index] ?? ""}
                    onChange={(event) => onChangeFinalist(index as 0 | 1, event.target.value)}
                    style={selectStyle}
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

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ ...typography.small, color: colors.textSecondary }}>Campeon</span>
                <select
                  aria-label="Campeon"
                  disabled={isSaving}
                  value={formState.champion ?? ""}
                  onChange={(event) => onChangeChampion(event.target.value)}
                  style={selectStyle}
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
          <Card elevated style={{ gap: spacing[12], padding: spacing[16] }}>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>PICKS ORIGINALES</span>
              <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>
                {data.status === "adjustment_available" ? "Tu base inicial ya quedo congelada" : "Asi quedaron tus picks iniciales"}
              </strong>
            </div>
            <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {MACRO_GROUPS.map((group) => {
                const groupPick = data.groupPicks[group.groupId];

                return (
                  <div
                    key={group.groupId}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: spacing[12],
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <span style={{ ...typography.small, color: colors.textMuted }}>{group.label}</span>
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
        <Card elevated style={{ gap: spacing[16], padding: spacing[16] }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.primary500 }}>AJUSTE POST GRUPOS</span>
            <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>Ahora solo puedes tocar finalistas y campeon</strong>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
              Este ajuste es unico e irreversible. Los grupos ya no se modifican y el modelo aplica penalizacion reducida en los aciertos finales.
            </p>
          </div>

          <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[0, 1].map((index) => (
              <label key={index} style={{ display: "grid", gap: 8 }}>
                <span style={{ ...typography.small, color: colors.textSecondary }}>Nuevo finalista {index + 1}</span>
                <select
                  aria-label={`Nuevo finalista ${index + 1}`}
                  disabled={isConfirmingAdjustment}
                  value={adjustmentState.finalists[index] ?? ""}
                  onChange={(event) => onChangeAdjustmentFinalist(index as 0 | 1, event.target.value)}
                  style={selectStyle}
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

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ ...typography.small, color: colors.textSecondary }}>Nuevo campeon</span>
              <select
                aria-label="Nuevo campeon"
                disabled={isConfirmingAdjustment}
                value={adjustmentState.champion}
                onChange={(event) => onChangeAdjustmentChampion(event.target.value)}
                style={selectStyle}
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
            <div
              style={{
                display: "grid",
                gap: 6,
                padding: spacing[12],
                borderRadius: 14,
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.24)"
              }}
            >
              {adjustmentValidationMessages.map((message) => (
                <p key={message} style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
                  {message}
                </p>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>
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
