import type { MatchSummary } from "@prode/shared";
import { copyForLocale, formatDateTime, type AppLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";

export function toKickoffLabel(iso: string, locale: AppLocale) {
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

export function pickPriorityMatch(matches: MatchSummary[]) {
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

export function pickNextChronologicalMatch(matches: MatchSummary[], now = new Date()) {
  return (
    matches.find(
      (match) => match.status === "scheduled" && new Date(match.kickoffAt).getTime() > now.getTime()
    ) ?? null
  );
}

export function toEditWindowLabel(deadlineIso: string, locale: AppLocale, now = new Date()) {
  const diffMs = new Date(deadlineIso).getTime() - now.getTime();

  if (diffMs <= 0) {
    return copyForLocale(locale, "Ventana de edicion cerrada", "Edit window closed");
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes - days * 60 * 24;
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  if (days > 0) {
    return copyForLocale(locale, `Podes editarla ${days}d ${hours}h mas`, `You can still edit ${days}d ${hours}h`);
  }

  if (hours > 0) {
    return copyForLocale(locale, `Podes editarla ${hours}h ${minutes}m mas`, `You can still edit ${hours}h ${minutes}m`);
  }

  return copyForLocale(locale, `Podes editarla ${minutes}m mas`, `You can still edit ${minutes}m`);
}

export function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

export function pickFinalIfFinished(matches: MatchSummary[]): MatchSummary | null {
  return (
    matches.find(
      (match) => match.stage === "FINAL" && match.isFinished && match.isScored
    ) ?? null
  );
}

export function resolveChampionFromFinal(match: MatchSummary): MatchSummary["homeTeam"] | null {
  if (match.homeScore90 === null || match.awayScore90 === null) {
    return null;
  }
  if (match.homeScore90 > match.awayScore90) {
    return match.homeTeam;
  }
  if (match.awayScore90 > match.homeScore90) {
    return match.awayTeam;
  }
  return null;
}
