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
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
};

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

  return data.matches;
}

export function mapExternalStatus(externalStatus: string): "scheduled" | "live" | "finished" | null {
  return STATUS_MAP[externalStatus] ?? null;
}
