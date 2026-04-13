import type { ConfirmMacroAdjustmentInput, MacroPicksResponse, SaveMacroPicksInput } from "@prode/shared";

function getFilledUniqueTeams(teamIds: string[]) {
  return Array.from(new Set(teamIds.filter((teamId) => Boolean(teamId))));
}

export function getMacroPicksValidationMessages(input: SaveMacroPicksInput): string[] {
  const messages: string[] = [];

  for (const [groupId, groupPick] of Object.entries(input.groupPicks)) {
    if (!groupPick?.firstTeamId || !groupPick.secondTeamId) {
      continue;
    }

    if (groupPick.firstTeamId === groupPick.secondTeamId) {
      messages.push(`En el grupo ${groupId} no puedes repetir el mismo equipo en 1° y 2° puesto.`);
    }
  }

  const finalists = getFilledUniqueTeams(input.finalists);
  const hasDuplicateFinalists = finalists.length !== input.finalists.filter((teamId) => Boolean(teamId)).length;

  if (hasDuplicateFinalists) {
    messages.push("Los dos finalistas deben ser equipos distintos.");
  }

  if (input.champion && finalists.length === 2 && !finalists.includes(input.champion)) {
    messages.push("El campeon debe estar incluido entre tus dos finalistas.");
  }

  return messages;
}

export function getMacroAdjustmentValidationMessages(input: ConfirmMacroAdjustmentInput): string[] {
  const messages: string[] = [];
  const finalists = getFilledUniqueTeams(input.finalists);
  const rawFinalists = input.finalists.filter((teamId) => Boolean(teamId));

  if (rawFinalists.length < 2) {
    messages.push("Para confirmar el ajuste debes elegir dos finalistas.");
  } else if (finalists.length !== rawFinalists.length) {
    messages.push("El ajuste necesita dos finalistas distintos.");
  }

  if (!input.champion) {
    messages.push("Para confirmar el ajuste debes elegir un campeon.");
  } else if (!finalists.includes(input.champion)) {
    messages.push("El campeon ajustado debe coincidir con uno de los finalistas elegidos.");
  }

  return messages;
}

export function getMacroPicksCompletionHint(data: MacroPicksResponse | null): string | null {
  if (!data) {
    return null;
  }

  const missingParts: string[] = [];

  if (data.completion.groupsCompleted < data.completion.groupsTotal) {
    missingParts.push(`${data.completion.groupsTotal - data.completion.groupsCompleted} grupos`);
  }

  if (!data.completion.hasFinalists) {
    missingParts.push("los 2 finalistas");
  }

  if (!data.completion.hasChampion) {
    missingParts.push("el campeon");
  }

  if (missingParts.length === 0) {
    return "Tu pick inicial ya esta completo y listo para quedar bloqueado al kickoff.";
  }

  return `Todavia te falta definir ${missingParts.join(", ")} para cerrar el pick inicial completo.`;
}
