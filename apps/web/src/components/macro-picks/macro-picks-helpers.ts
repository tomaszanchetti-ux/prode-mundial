import type {
  ConfirmMacroAdjustmentInput,
  MacroGroupPicks,
  MacroPicksResponse,
  SaveMacroPicksInput
} from "@prode/shared";

export function cloneGroupPicks(groupPicks: MacroGroupPicks): MacroGroupPicks {
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

export function buildInitialFormState(data: MacroPicksResponse | null): SaveMacroPicksInput {
  return {
    groupPicks: cloneGroupPicks(data?.groupPicks ?? {}),
    finalists: data?.finalists ?? [],
    champion: data?.champion ?? null
  };
}

export function buildInitialAdjustmentState(data: MacroPicksResponse | null): ConfirmMacroAdjustmentInput {
  return {
    finalists: (data?.adjustedFinalists ?? data?.finalists ?? []).slice(0, 2),
    champion: data?.adjustedChampion ?? data?.champion ?? ""
  };
}

export function formatDeadline(value: string | null | undefined) {
  if (!value) {
    return "por definir";
  }

  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export type StatusMeta = {
  label: string;
  tone: "editable" | "scored" | "locked" | "live";
  description: string;
};

export function resolveStatusMeta(status: MacroPicksResponse["status"]): StatusMeta {
  switch (status) {
    case "draft_editable":
      return { label: "Draft", tone: "editable", description: "Puedes avanzar por partes y guardar sin cerrar todo." };
    case "submitted_editable":
      return { label: "Guardado", tone: "scored", description: "Tus picks iniciales quedaron completos y todavia pueden cambiar." };
    case "locked_original":
      return { label: "Bloqueado", tone: "locked", description: "La ventana inicial ya cerro. Tus picks originales quedan congelados." };
    case "adjustment_available":
      return { label: "Ajuste abierto", tone: "live", description: "Ya puedes cambiar solo finalistas y campeon antes del primer knockout." };
    case "adjusted_locked":
      return { label: "Ajustado", tone: "scored", description: "El ajuste ya fue confirmado y no se puede volver a tocar." };
    case "fully_scored":
      return { label: "Scored", tone: "scored", description: "El modulo macro ya termino todo su ciclo competitivo." };
    case "not_started":
    default:
      return { label: "Pendiente", tone: "locked", description: "Todavia no empezaste tus picks macro del torneo." };
  }
}
