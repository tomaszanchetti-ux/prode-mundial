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
  | "INVALID_GROUP_PICK_DUPLICATE"
  | "INVALID_FINALISTS_DUPLICATE"
  | "INVALID_CHAMPION_NOT_IN_FINALISTS"
  | "MATCH_LOCKED"
  | "PHASE_LOCKED"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_EDITABLE"
  | "MATCH_NOT_SCOREABLE"
  | "MACRO_PICKS_LOCKED"
  | "CHAMPION_PICK_LOCKED"
  | "CHAMPION_PICK_NOT_FOUND"
  | "CHAMPION_RESULT_NOT_FOUND"
  | "ADJUSTMENT_NOT_AVAILABLE"
  | "ADJUSTMENT_WINDOW_CLOSED"
  | "ADJUSTMENT_ALREADY_USED"
  | "LEAGUE_NOT_FOUND"
  | "LEAGUE_INACTIVE"
  | "LEAGUE_CAPACITY_REACHED"
  | "ALREADY_LEAGUE_MEMBER"
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
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
