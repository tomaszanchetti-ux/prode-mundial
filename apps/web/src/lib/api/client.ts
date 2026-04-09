import type { ApiResponse, PublicBootstrap, UpdateProfileInput, UserProfile } from "@prode/shared";
import { publicBootstrapSchema, userProfileSchema } from "@prode/shared";
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
