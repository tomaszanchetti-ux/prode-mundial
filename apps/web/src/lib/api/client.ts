import type {
  AdjustChampionInput,
  AdjustChampionResponse,
  ApiResponse,
  ChampionPickResponse,
  CreateLeagueInput,
  JoinLeagueInput,
  LeagueDetail,
  LeagueInvitePreview,
  LeagueStandingsResponse,
  ListMyLeaguesResponse,
  ListMatchesQuery,
  ListMatchesResponse,
  MatchDetail,
  PointsResponse,
  PreTournamentSummary,
  PublicBootstrap,
  SaveChampionPickInput,
  SaveChampionPickResponse,
  SaveMatchPredictionInput,
  SaveMatchPredictionResponse,
  TuMundialResponse,
  UpdateProfileInput,
  UserProfile
} from "@prode/shared";
import {
  adjustChampionInputSchema,
  adjustChampionResponseSchema,
  championPickResponseSchema,
  createLeagueInputSchema,
  joinLeagueInputSchema,
  leagueDetailSchema,
  leagueInvitePreviewSchema,
  leagueStandingsResponseSchema,
  listMyLeaguesResponseSchema,
  listMatchesResponseSchema,
  matchDetailSchema,
  pointsResponseSchema,
  preTournamentSummarySchema,
  publicBootstrapSchema,
  saveChampionPickInputSchema,
  saveChampionPickResponseSchema,
  saveMatchPredictionResponseSchema,
  tuMundialResponseSchema,
  userProfileSchema
} from "@prode/shared";
import { webConfig } from "@/config/app";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, options: { status: number; code?: string | null }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code ?? null;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function withBearer(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function buildApiError(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);
  const code =
    payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object" && "code" in payload.error
      ? String(payload.error.code)
      : null;
  const message =
    payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object" && "message" in payload.error
      ? String(payload.error.message)
      : fallbackMessage;

  return new ApiClientError(message, {
    status: response.status,
    code
  });
}

export async function getPublicBootstrap(): Promise<PublicBootstrap> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/public/bootstrap`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load bootstrap (${response.status}).`);
  }

  return publicBootstrapSchema.parse(await parseJson<PublicBootstrap>(response));
}

export async function getLeagueInvitePreview(inviteToken: string): Promise<LeagueInvitePreview> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/public/leagues/invite/${inviteToken}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load invite preview (${response.status}).`);
  }

  return leagueInvitePreviewSchema.parse(await parseJson<LeagueInvitePreview>(response));
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load profile (${response.status}).`);
  }

  return userProfileSchema.parse(await parseJson<UserProfile>(response));
}

export async function getPreTournamentSummary(token: string): Promise<PreTournamentSummary> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me/pre-tournament`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load pre-tournament summary (${response.status}).`);
  }

  return preTournamentSummarySchema.parse(await parseJson<PreTournamentSummary>(response));
}

export async function getTuMundial(token: string): Promise<TuMundialResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me/tournament`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load Tu Mundial (${response.status}).`);
  }

  return tuMundialResponseSchema.parse(await parseJson<TuMundialResponse>(response));
}

export async function getChampionPick(token: string): Promise<ChampionPickResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/macro-picks`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load champion pick (${response.status}).`);
  }

  return championPickResponseSchema.parse(await parseJson<ChampionPickResponse>(response));
}

export async function saveChampionPick(token: string, input: SaveChampionPickInput): Promise<SaveChampionPickResponse> {
  const payload = saveChampionPickInputSchema.parse(input);
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/macro-picks`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to save champion pick (${response.status}).`);
  }

  return saveChampionPickResponseSchema.parse(await parseJson<SaveChampionPickResponse>(response));
}

export async function adjustChampionPick(
  token: string,
  input: AdjustChampionInput
): Promise<AdjustChampionResponse> {
  const payload = adjustChampionInputSchema.parse(input);
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/macro-picks/adjustment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to confirm champion adjustment (${response.status}).`);
  }

  return adjustChampionResponseSchema.parse(await parseJson<AdjustChampionResponse>(response));
}

export async function getPoints(token: string): Promise<PointsResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/points`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load points (${response.status}).`);
  }

  return pointsResponseSchema.parse(await parseJson<PointsResponse>(response));
}

export async function getMyLeagues(token: string): Promise<ListMyLeaguesResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/leagues`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load leagues (${response.status}).`);
  }

  return listMyLeaguesResponseSchema.parse(await parseJson<ListMyLeaguesResponse>(response));
}

export async function createLeague(token: string, input: CreateLeagueInput): Promise<LeagueDetail> {
  const payload = createLeagueInputSchema.parse(input);
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/leagues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to create league (${response.status}).`);
  }

  return leagueDetailSchema.parse(await parseJson<LeagueDetail>(response));
}

export async function joinLeague(token: string, input: JoinLeagueInput): Promise<LeagueDetail> {
  const payload = joinLeagueInputSchema.parse(input);
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/leagues/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to join league (${response.status}).`);
  }

  return leagueDetailSchema.parse(await parseJson<LeagueDetail>(response));
}

export async function getLeagueDetail(token: string, leagueId: string): Promise<LeagueDetail> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/leagues/${leagueId}`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load league detail (${response.status}).`);
  }

  return leagueDetailSchema.parse(await parseJson<LeagueDetail>(response));
}

export async function getLeagueStandings(token: string, leagueId: string): Promise<LeagueStandingsResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/leagues/${leagueId}/standings`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load standings (${response.status}).`);
  }

  return leagueStandingsResponseSchema.parse(await parseJson<LeagueStandingsResponse>(response));
}

export async function updateMyProfile(token: string, input: UpdateProfileInput): Promise<UserProfile> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to update profile (${response.status}).`);
  }

  return userProfileSchema.parse(await parseJson<UserProfile>(response));
}

export async function getMatches(token: string, query: ListMatchesQuery = {}): Promise<ListMatchesResponse> {
  const params = new URLSearchParams();

  if (query.stage) {
    params.set("stage", query.stage);
  }

  if (query.filter) {
    params.set("filter", query.filter);
  }

  if (query.cursor) {
    params.set("cursor", query.cursor);
  }

  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }

  const url = `${webConfig.apiBaseUrl}/api/v1/matches${params.size > 0 ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load matches (${response.status}).`);
  }

  return listMatchesResponseSchema.parse(await parseJson<ListMatchesResponse>(response));
}

export async function getMatchDetail(token: string, matchId: string): Promise<MatchDetail> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/matches/${matchId}`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to load match detail (${response.status}).`);
  }

  return matchDetailSchema.parse(await parseJson<MatchDetail>(response));
}

export async function saveMatchPrediction(
  token: string,
  matchId: string,
  input: SaveMatchPredictionInput
): Promise<SaveMatchPredictionResponse> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/matches/${matchId}/prediction`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...withBearer(token)
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to save prediction (${response.status}).`);
  }

  return saveMatchPredictionResponseSchema.parse(await parseJson<SaveMatchPredictionResponse>(response));
}
