import type { ApiErrorCode, ApiSuccess } from "@prode/shared";

export function ok<T>(data: T): ApiSuccess<T> {
  return {
    ok: true,
    data
  };
}

export function errorPayload(
  code: ApiErrorCode,
  message: string,
  details: Record<string, unknown> = {}
) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details
    }
  };
}
