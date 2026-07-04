import type { GlobalStandingsResponse, LeagueStandingEntry, LeagueStandingsResponse, PointsResponse } from "@prode/shared";
import { copyForLocale, type AppLocale } from "@/lib/i18n/locale-provider";

export const GLOBAL_LEAGUE_ID = "__global__";
export const GLOBAL_LEAGUE_NAME = "Global";

export type LeagueOption = {
  leagueId: string;
  name: string;
  isGlobal: boolean;
};

export type SyntheticSummary = {
  positionLabel: string;
  pointsLabel: string;
  gapLabel: string | null;
  // Flag estable (no depende del label localizado) para que la UI decida si
  // mostrar el chip de posición sin comparar contra un string traducido.
  hasStanding: boolean;
};

export function toGlobalStandingsView(global: GlobalStandingsResponse): LeagueStandingsResponse {
  return {
    league: {
      leagueId: GLOBAL_LEAGUE_ID,
      name: GLOBAL_LEAGUE_NAME,
      memberLimit: Math.max(global.participantsCount, 1),
      membersCount: global.participantsCount
    },
    items: global.items,
    myStanding: global.myStanding
  };
}

export function buildSyntheticSummary(
  points: PointsResponse | null,
  standings: LeagueStandingsResponse | null,
  isGlobal: boolean,
  locale: AppLocale
): SyntheticSummary {
  const myStanding = standings?.myStanding;

  if (isGlobal) {
    if (!myStanding) {
      return {
        positionLabel: copyForLocale(locale, "Sin puesto", "No rank"),
        pointsLabel: `${points?.totalPoints ?? 0} pts`,
        gapLabel: null,
        hasStanding: false
      };
    }

    const gapLabel = buildGapLabel(standings, myStanding.position, locale);

    return {
      positionLabel: `#${myStanding.position}`,
      pointsLabel: `${myStanding.totalPoints} pts`,
      gapLabel,
      hasStanding: true
    };
  }

  if (!myStanding) {
    return {
      positionLabel: copyForLocale(locale, "Sin puesto", "No rank"),
      pointsLabel: `${points?.totalPoints ?? 0} pts`,
      gapLabel: null,
      hasStanding: false
    };
  }

  const gapLabel = buildGapLabel(standings, myStanding.position, locale);

  return {
    positionLabel: `#${myStanding.position}`,
    pointsLabel: `${myStanding.totalPoints} pts`,
    gapLabel,
    hasStanding: true
  };
}

function buildGapLabel(
  standings: LeagueStandingsResponse | null,
  myPosition: number,
  locale: AppLocale
): string | null {
  if (!standings || standings.items.length < 2) {
    return null;
  }

  if (myPosition === 1) {
    const runnerUp = standings.items[1];
    const me = standings.items[0];

    if (!runnerUp || !me) {
      return null;
    }

    return copyForLocale(
      locale,
      `+${me.totalPoints - runnerUp.totalPoints} al 2°`,
      `+${me.totalPoints - runnerUp.totalPoints} over 2nd`
    );
  }

  const leader = standings.items[0];
  const me = standings.items.find((entry) => entry.position === myPosition);

  if (!leader || !me) {
    return null;
  }

  const gap = leader.totalPoints - me.totalPoints;
  return gap === 0
    ? copyForLocale(locale, "Empatado con la punta", "Tied for the lead")
    : copyForLocale(locale, `-${gap} de la punta`, `-${gap} off the lead`);
}

export function toStandingRowClass(entry: Pick<LeagueStandingEntry, "isMe" | "position">) {
  if (entry.isMe) return "standing-me";
  if (entry.position === 1) return "standing-leader";
  if (entry.position <= 3) return "standing-podium";
  return "standing-default";
}

export function toPositionColor(entry: Pick<LeagueStandingEntry, "isMe" | "position">) {
  if (entry.isMe) return "text-primary-500";
  if (entry.position === 1) return "text-gold";
  return "text-text-muted";
}
