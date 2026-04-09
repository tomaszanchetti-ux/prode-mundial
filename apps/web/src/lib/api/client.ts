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

export async function getPublicBootstrap(): Promise<PublicBootstrap> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/public/bootstrap`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load bootstrap.");
  }

  return publicBootstrapSchema.parse(await parseJson<PublicBootstrap>(response));
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to load profile.");
  }

  return userProfileSchema.parse(await parseJson<UserProfile>(response));
}

export async function updateMyProfile(token: string, input: UpdateProfileInput): Promise<UserProfile> {
  const response = await fetch(`${webConfig.apiBaseUrl}/api/v1/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error("Failed to update profile.");
  }

  return userProfileSchema.parse(await parseJson<UserProfile>(response));
}
