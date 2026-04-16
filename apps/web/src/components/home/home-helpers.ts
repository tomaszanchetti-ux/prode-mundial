import type { MatchSummary, PreTournamentSummary } from "@prode/shared";
import { copyForLocale, formatDateTime, type AppLocale } from "@/lib/i18n/locale-provider";
import { canEditPrediction } from "@/lib/matches/editability";

export function toStageLabel(match: MatchSummary, locale: AppLocale) {
  if (match.stage === "group" && match.groupId) {
    return copyForLocale(locale, `Grupo ${match.groupId}`, `Group ${match.groupId}`);
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

  return labels[locale][match.stage as keyof (typeof labels)["es"]] ?? match.stage;
}

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

export function toCompletionCopy(summary: PreTournamentSummary, locale: AppLocale) {
  if (summary.totalMatches === 0) {
    return copyForLocale(locale, "Todavia no cargamos partidos de grupos para completar.", "We still haven't loaded group-stage matches to complete.");
  }

  if (summary.completedMatches === 0) {
    return copyForLocale(locale, `Empieza tu Mundial completando los ${summary.totalMatches} partidos de grupos.`, `Start your World Cup by completing the ${summary.totalMatches} group-stage matches.`);
  }

  if (summary.remainingMatches === 0) {
    return copyForLocale(locale, "Ya completaste toda la fase de grupos. Ahora puedes revisar como queda tu Mundial.", "You've completed the whole group stage. Now you can review how your World Cup looks.");
  }

  return copyForLocale(locale, `Ya llevas ${summary.completionPercentage}% y te faltan ${summary.remainingMatches} partidos para cerrar grupos.`, `You're already ${summary.completionPercentage}% in and still have ${summary.remainingMatches} matches left to close the groups.`);
}

export function toLeagueSummaryCopy(summary: PreTournamentSummary, locale: AppLocale) {
  if (summary.remainingMatches === 0) {
    return copyForLocale(locale, "Ya cerraste grupos. Revisa como queda tu torneo y compártelo.", "You've already closed the groups. Review your tournament and share it.");
  }

  if (summary.completedMatches === 0) {
    return copyForLocale(locale, "Cada partido que cargues empieza a darle forma a tu tabla proyectada.", "Every match you complete starts shaping your projected table.");
  }

  return copyForLocale(locale, `Te quedan ${summary.remainingMatches} partidos para completar tu simulacion y compararla con tus ligas.`, `You still have ${summary.remainingMatches} matches left to complete your simulation and compare it with your leagues.`);
}

export function toSupportCardTitle(summary: PreTournamentSummary | null, profileDisplayName: string | null, locale: AppLocale) {
  if (summary?.isPreTournament) {
    return profileDisplayName
      ? copyForLocale(locale, `${profileDisplayName}, tu liga te espera`, `${profileDisplayName}, your league is waiting`)
      : copyForLocale(locale, "Tu liga te espera", "Your league is waiting");
  }

  return profileDisplayName
    ? copyForLocale(locale, `${profileDisplayName}, sigue sumando`, `${profileDisplayName}, keep climbing`)
    : copyForLocale(locale, "Tu competencia sigue viva", "Your competition is still alive");
}

export function toTournamentSupportCopy(summary: PreTournamentSummary | null, locale: AppLocale) {
  if (summary?.isPreTournament) {
    return copyForLocale(locale, "Tu Mundial se actualiza a medida que completas grupos.", "Your World Cup updates as you complete the groups.");
  }

  return copyForLocale(locale, "Tu Mundial sigue disponible para revisar tus grupos proyectados.", "Your World Cup stays available to review your projected groups.");
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
