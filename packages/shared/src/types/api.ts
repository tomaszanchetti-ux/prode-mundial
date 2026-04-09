export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_TOKEN"
  | "VALIDATION_ERROR"
  | "INVALID_SCORE"
  | "INVALID_KNOCKOUT_CLASSIFIER"
  | "MATCH_LOCKED"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_EDITABLE"
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
