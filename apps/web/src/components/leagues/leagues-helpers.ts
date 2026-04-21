import type { LeagueStandingEntry, LeagueStandingsResponse, PointsResponse } from "@prode/shared";

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
};

export function buildSyntheticSummary(
  points: PointsResponse | null,
  standings: LeagueStandingsResponse | null,
  isGlobal: boolean
): SyntheticSummary {
  if (isGlobal) {
    return {
      positionLabel: "Global",
      pointsLabel: `${points?.totalPoints ?? 0} pts`,
      gapLabel: null
    };
  }

  const myStanding = standings?.myStanding;

  if (!myStanding) {
    return {
      positionLabel: "Sin puesto",
      pointsLabel: `${points?.totalPoints ?? 0} pts`,
      gapLabel: null
    };
  }

  const gapLabel = buildGapLabel(standings, myStanding.position);

  return {
    positionLabel: `#${myStanding.position}`,
    pointsLabel: `${myStanding.totalPoints} pts`,
    gapLabel
  };
}

function buildGapLabel(standings: LeagueStandingsResponse | null, myPosition: number): string | null {
  if (!standings || standings.items.length < 2) {
    return null;
  }

  if (myPosition === 1) {
    const runnerUp = standings.items[1];
    const me = standings.items[0];

    if (!runnerUp || !me) {
      return null;
    }

    return `+${me.totalPoints - runnerUp.totalPoints} al 2°`;
  }

  const leader = standings.items[0];
  const me = standings.items.find((entry) => entry.position === myPosition);

  if (!leader || !me) {
    return null;
  }

  const gap = leader.totalPoints - me.totalPoints;
  return gap === 0 ? "Empatado con la punta" : `-${gap} de la punta`;
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
