import type { Request, Response } from "express";
import { listMatchesQuerySchema, type ListMatchesQueryInput } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { matchesQueryService } from "../services/matches-query-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalString(value: unknown) {
  const candidate = firstQueryValue(value);
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : undefined;
}

function parseOptionalNumber(value: unknown) {
  const candidate = firstQueryValue(value);

  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : candidate;
}

function buildListMatchesQueryInput(query: Request["query"]): ListMatchesQueryInput {
  return parseBody(listMatchesQuerySchema, {
    stage: parseOptionalString(query.stage),
    filter: parseOptionalString(query.filter),
    cursor: parseOptionalString(query.cursor),
    limit: parseOptionalNumber(query.limit)
  });
}

export async function getMatchesController(req: Request, res: Response) {
  const query = buildListMatchesQueryInput(req.query);
  const result = await matchesQueryService.listMatchesForUser((req as AuthenticatedRequest).auth.userId, query);
  res.json(ok(result));
}
