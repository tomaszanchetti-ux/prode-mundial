import type { MatchStage, MatchSummary } from "@prode/shared";
import { copyForLocale, formatDateTime, type AppLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

export type FilterChip = {
  key: string;
  label: string;
};

export const filterChips: FilterChip[] = [
  { key: "pending", label: "Pendientes" },
  { key: "saved", label: "Guardados" },
  { key: "closed", label: "Cerrados" }
];

export function toFilterLabel(key: string, locale: AppLocale) {
  const labels = {
    pending: copyForLocale(locale, "Pendientes", "Pending"),
    saved: copyForLocale(locale, "Guardados", "Saved"),
    closed: copyForLocale(locale, "Cerrados", "Closed")
  } as const;

  return labels[key as keyof typeof labels] ?? key;
}

export function applyClientFilter(items: MatchSummary[], filterKey: string) {
  if (filterKey === "saved") {
    return items.filter((m) => m.predictionStatus === "saved_editable");
  }

  if (filterKey === "closed") {
    return items.filter((m) => !canEditPrediction(m) || m.predictionStatus === "scored");
  }

  return items.filter((m) => canEditPrediction(m) && m.predictionStatus === "empty");
}

export function toLocalKickoffLabel(iso: string, locale: AppLocale) {
  return formatDateTime(locale, iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function toCountdownLabel(targetIso: string, locale: AppLocale, now = new Date()) {
  const diffMs = new Date(targetIso).getTime() - now.getTime();

  if (diffMs <= 0) {
    return copyForLocale(locale, "Disponible ahora", "Available now");
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return copyForLocale(locale, `Abre en ${minutes}m`, `Opens in ${minutes}m`);
  }

  if (minutes === 0) {
    return copyForLocale(locale, `Abre en ${hours}h`, `Opens in ${hours}h`);
  }

  return copyForLocale(locale, `Abre en ${hours}h ${minutes}m`, `Opens in ${hours}h ${minutes}m`);
}

export function toStageLabel(stage: MatchStage, groupId: string | null, locale: AppLocale) {
  if (stage === "group" && groupId) {
    return copyForLocale(locale, `Grupo ${groupId}`, `Group ${groupId}`);
  }

  const labels = {
    es: {
      R32: "Octavos",
      R16: "R16",
      QF: "Cuartos",
      SF: "Semifinal",
      BRONZE: "Tercer puesto",
      FINAL: "Final"
    },
    en: {
      R32: "Round of 32",
      R16: "Round of 16",
      QF: "Quarterfinal",
      SF: "Semifinal",
      BRONZE: "Third place",
      FINAL: "Final"
    }
  };

  return labels[locale][stage as keyof (typeof labels)["es"]] ?? stage;
}

// WS50: umbral de urgencia para tone "closing-soon" (2h antes del cierre de predicciones).
export const CLOSING_SOON_THRESHOLD_MS = 2 * 60 * 60 * 1000;

function isClosingSoon(deadlineIso: string, now = new Date()) {
  const diffMs = new Date(deadlineIso).getTime() - now.getTime();
  return diffMs > 0 && diffMs <= CLOSING_SOON_THRESHOLD_MS;
}

export function toCardTone(match: MatchSummary, now = new Date()) {
  if (match.isScored || match.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (match.status === "live") {
    return "live" as const;
  }

  if (!canEditPrediction(match)) {
    return "neutral" as const;
  }

  // Editable: si hay predicción guardada → verde; si empty y cierra pronto → amarillo; si no → azul.
  if (match.predictionStatus === "saved_editable") {
    return "saved" as const;
  }

  if (isClosingSoon(match.deadlineAt, now)) {
    return "closing-soon" as const;
  }

  return "editable" as const;
}

export function toStatusLabel(match: MatchSummary, now = new Date()) {
  if (match.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (match.status === "live") {
    return "En vivo";
  }

  if (isPredictionWindowNotOpen(match, now)) {
    return "Abre despues";
  }

  if (!canEditPrediction(match)) {
    return "Cerrado";
  }

  if (match.predictionStatus === "saved_editable") {
    return "Guardado";
  }

  if (isClosingSoon(match.deadlineAt, now)) {
    return "Cierra pronto";
  }

  return "Pendiente";
}

export function toPredictionCopy(match: MatchSummary, _locale: AppLocale) {
  return match.userPredictionSummary ?? null;
}

export function pickQuickMatch(matches: MatchSummary[]) {
  return matches.find((match) => canEditPrediction(match) && match.predictionStatus === "empty") ?? matches.find((match) => canEditPrediction(match)) ?? null;
}

export function pickNextOpeningMatch(matches: MatchSummary[], now = new Date()) {
  return (
    matches.find(
      (match) =>
        !canEditPrediction(match) &&
        match.status === "scheduled" &&
        new Date(match.predictionOpensAt).getTime() > now.getTime()
    ) ?? null
  );
}
