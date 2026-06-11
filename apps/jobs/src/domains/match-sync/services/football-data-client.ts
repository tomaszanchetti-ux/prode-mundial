/**
 * Cliente HTTP para football-data.org v4 (versión jobs)
 * Docs: https://docs.football-data.org/general/v4/match.html
 */

const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC";

const STATUS_MAP: Record<string, "scheduled" | "live" | "finished" | null> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  SUSPENDED: null,
  POSTPONED: null,
  CANCELLED: null
};

// football-data.org usa códigos propios donde nuestro seed usa códigos FIFA.
// Verificado contra /v4/competitions/WC/matches season 2026: única discrepancia URY.
const TEAM_CODE_ALIASES: Record<string, string> = {
  URY: "URU"
};

export function normalizeTeamCode(tla: string): string {
  return TEAM_CODE_ALIASES[tla] ?? tla;
}

type ScoreSide = { home: number | null; away: number | null };

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string; shortName: string; tla: string };
  awayTeam: { id: number; name: string; shortName: string; tla: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration?: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    fullTime: ScoreSide;
    halfTime: ScoreSide;
    regularTime?: ScoreSide | null;
    extraTime?: ScoreSide | null;
    penalties?: ScoreSide | null;
  };
};

/**
 * Marcador a los 90 minutos — la base del scoring 5/2/0.
 * En v4, cuando duration != REGULAR, `fullTime` acumula prórroga (y penales);
 * el resultado de los 90' viene en `regularTime`.
 */
export function resolveScore90(match: FootballDataMatch): ScoreSide {
  const duration = match.score.duration ?? "REGULAR";

  if (duration !== "REGULAR") {
    const regular = match.score.regularTime;
    if (regular && regular.home !== null && regular.away !== null) {
      return regular;
    }
  }

  return match.score.fullTime;
}

type FootballDataMatchesResponse = {
  count: number;
  matches: FootballDataMatch[];
};

function getApiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY?.trim();

  if (!key || key === "replace-me" || key === "your-api-key-here") {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured.");
  }

  return key;
}

async function fetchFromApi<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { "X-Auth-Token": getApiKey() }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`football-data.org ${response.status}: ${response.statusText} — ${body}`);
  }

  return response.json() as Promise<T>;
}

/** Fetch live + recently finished matches (main sync query). */
export async function fetchSyncableMatches(): Promise<FootballDataMatch[]> {
  const data = await fetchFromApi<FootballDataMatchesResponse>(
    `/competitions/${COMPETITION_CODE}/matches?status=IN_PLAY,PAUSED,FINISHED`
  );

  return data.matches.map((match) => ({
    ...match,
    homeTeam: { ...match.homeTeam, tla: normalizeTeamCode(match.homeTeam.tla) },
    awayTeam: { ...match.awayTeam, tla: normalizeTeamCode(match.awayTeam.tla) }
  }));
}

export function mapExternalStatus(externalStatus: string): "scheduled" | "live" | "finished" | null {
  return STATUS_MAP[externalStatus] ?? null;
}
