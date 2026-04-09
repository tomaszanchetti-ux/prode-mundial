import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error";
import { errorPayload } from "../http/respond";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    console.error("[api-error]", error.code, error.message, error.details ?? {});
    return res.status(error.statusCode).json(errorPayload(error.code, error.message, error.details));
  }

  console.error("[api-error] unexpected", error);
  return res.status(500).json(errorPayload("INTERNAL_ERROR", "Unexpected server error."));
}
