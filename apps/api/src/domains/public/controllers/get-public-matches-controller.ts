import type { Request, Response } from "express";
import { publicMatchesQuerySchema, type PublicMatchListResponse } from "@prode/shared";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { publicContentService } from "../services/public-content-service";

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalString(value: unknown) {
  const candidate = firstQueryValue(value);
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : undefined;
}

export async function getPublicMatchesController(req: Request, res: Response) {
  const query = parseBody(publicMatchesQuerySchema, {
    stage: parseOptionalString(req.query.stage),
    filter: parseOptionalString(req.query.filter)
  });

  const items = await publicContentService.listMatches(query);
  const payload: PublicMatchListResponse = { items };

  res.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
  res.json(ok(payload));
}
