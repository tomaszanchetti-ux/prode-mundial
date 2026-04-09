export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_TOKEN"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
