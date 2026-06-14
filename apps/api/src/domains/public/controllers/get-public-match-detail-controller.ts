import type { Request, Response } from "express";
import type { PublicMatchDetail } from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { ok } from "../../../server/http/respond";
import { publicContentService } from "../services/public-content-service";

export async function getPublicMatchDetailController(req: Request, res: Response) {
  const matchId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const match = await publicContentService.getMatch(matchId);

  if (!match) {
    throw new ApiError(404, "MATCH_NOT_FOUND", `Match ${matchId} was not found.`, { matchId });
  }

  const payload: PublicMatchDetail = match;

  res.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
  res.json(ok(payload));
}
