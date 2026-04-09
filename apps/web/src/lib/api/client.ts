import type { ApiResponse, PublicBootstrap, UpdateProfileInput, UserProfile } from "@prode/shared";
import { publicBootstrapSchema, userProfileSchema } from "@prode/shared";
import { webConfig } from "@/config/app";

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

export async function getPublicBootstrap(): Promise<PublicBootstrap> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/public/bootstrap`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to load bootstrap (${response.status}).`);
  }

  return publicBootstrapSchema.parse(await parseJson<PublicBootstrap>(response));
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me`, {
    cache: "no-store",
    headers: withBearer(token)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object" && "message" in payload.error
        ? String(payload.error.message)
        : `Failed to load profile (${response.status}).`;
    throw new Error(message);
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
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error && typeof payload.error === "object" && "message" in payload.error
        ? String(payload.error.message)
        : `Failed to update profile (${response.status}).`;
    throw new Error(message);
  }

  return userProfileSchema.parse(await parseJson<UserProfile>(response));
}
