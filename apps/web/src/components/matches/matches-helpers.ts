import type { ListMatchesQuery, MatchStage, MatchSummary } from "@prode/shared";
import { copyForLocale, formatDateTime, type AppLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction, isPredictionWindowNotOpen } from "@/lib/matches/editability";

export type FilterChip = {
  key: string;
  label: string;
  query: ListMatchesQuery;
};

export const filterChips: FilterChip[] = [
  { key: "today", label: "Hoy", query: { filter: "today" } },
  { key: "pending", label: "Pendientes", query: { filter: "upcoming" } },
  { key: "upcoming", label: "Proximos", query: { filter: "upcoming" } },
  { key: "group", label: "Grupos", query: { stage: "group" } },
  { key: "R32", label: "Octavos", query: { stage: "R32" } },
  { key: "QF", label: "Cuartos", query: { stage: "QF" } },
  { key: "SF", label: "Semis", query: { stage: "SF" } },
  { key: "FINAL", label: "Final", query: { stage: "FINAL" } },
  { key: "all", label: "Todos", query: {} }
];

export function toFilterLabel(key: string, locale: AppLocale) {
  const labels = {
    today: copyForLocale(locale, "Hoy", "Today"),
    pending: copyForLocale(locale, "Pendientes", "Pending"),
    upcoming: copyForLocale(locale, "Proximos", "Upcoming"),
    group: copyForLocale(locale, "Grupos", "Groups"),
    R32: copyForLocale(locale, "Octavos", "R32"),
    QF: copyForLocale(locale, "Cuartos", "Quarterfinals"),
    SF: copyForLocale(locale, "Semis", "Semis"),
    FINAL: copyForLocale(locale, "Final", "Final"),
    all: copyForLocale(locale, "Todos", "All")
  } as const;

  return labels[key as keyof typeof labels] ?? key;
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

export function toCardTone(match: MatchSummary) {
  if (match.isScored || match.predictionStatus === "scored") {
    return "scored" as const;
  }

  if (match.status === "live") {
    return "live" as const;
  }

  if (!canEditPrediction(match)) {
    return "locked" as const;
  }

  return "editable" as const;
}

export function toStatusLabel(match: MatchSummary) {
  if (match.predictionStatus === "scored") {
    return "Puntuado";
  }

  if (match.status === "live") {
    return "En vivo";
  }

  if (isPredictionWindowNotOpen(match)) {
    return "Abre despues";
  }

  if (!canEditPrediction(match)) {
    return "Cerrado";
  }

  if (match.predictionStatus === "saved_editable") {
    return "Guardado";
  }

  return "Pendiente";
}

export function summarizeActiveFilter(query: ListMatchesQuery, locale: AppLocale) {
  if (query.filter === "today") {
    return copyForLocale(locale, "Tus partidos de hoy, listos para resolver rapido.", "Today's matches, ready to solve quickly.");
  }

  if (query.filter === "upcoming") {
    return copyForLocale(locale, "Los siguientes cruces abiertos para predecir o editar.", "The next open matches to predict or edit.");
  }

  if (query.stage === "group") {
    return copyForLocale(locale, "Todo lo que sigue vivo en fase de grupos.", "Everything still alive in the group stage.");
  }

  if (query.stage === "R32") {
    return copyForLocale(locale, "Cruces directos listos para escanear.", "Direct knockout matchups ready to scan.");
  }

  if (query.stage === "QF") {
    return copyForLocale(locale, "Cuartos con foco total en cada llave.", "Quarterfinals with total focus on every bracket.");
  }

  if (query.stage === "SF") {
    return copyForLocale(locale, "Semifinales para ajustar lo importante.", "Semifinals to fine-tune the important part.");
  }

  if (query.stage === "FINAL") {
    return copyForLocale(locale, "La definicion del torneo en una sola vista.", "The tournament decider in one single view.");
  }

  return copyForLocale(locale, "Todos tus partidos disponibles en una sola pasada.", "All your available matches in one pass.");
}

export function toPredictionCopy(match: MatchSummary, locale: AppLocale) {
  if (match.predictionStatus === "scored") {
    return match.userPredictionSummary ? copyForLocale(locale, `Tu prediccion: ${match.userPredictionSummary}`, `Your prediction: ${match.userPredictionSummary}`) : copyForLocale(locale, "Partido puntuado", "Scored match");
  }

  if (!match.userPredictionSummary) {
    return copyForLocale(locale, "Aun no predijiste este partido", "You haven't predicted this match yet");
  }

  return copyForLocale(locale, `Tu prediccion: ${match.userPredictionSummary}`, `Your prediction: ${match.userPredictionSummary}`);
}

export function toResultCopy(match: MatchSummary, locale: AppLocale) {
  if (match.predictionStatus === "scored") {
    return copyForLocale(locale, "Abre el detalle para ver resultado y puntos.", "Open the detail to see the result and points.");
  }

  if (isPredictionWindowNotOpen(match)) {
    return copyForLocale(locale, `Se habilita ${toLocalKickoffLabel(match.predictionOpensAt, locale)}.`, `Opens ${toLocalKickoffLabel(match.predictionOpensAt, locale)}.`);
  }

  if (!canEditPrediction(match)) {
    return copyForLocale(locale, "Prediccion cerrada. Solo queda seguir el partido.", "Prediction locked. You can only follow the match now.");
  }

  return copyForLocale(locale, `Deadline exacto: ${toLocalKickoffLabel(match.deadlineAt, locale)}`, `Exact deadline: ${toLocalKickoffLabel(match.deadlineAt, locale)}`);
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
