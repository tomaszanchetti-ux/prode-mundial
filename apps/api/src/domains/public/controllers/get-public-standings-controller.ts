import type { Request, Response } from "express";
import type { PublicStandingsResponse } from "@prode/shared";
import { ok } from "../../../server/http/respond";
import { publicContentService } from "../services/public-content-service";

export async function getPublicStandingsController(_req: Request, res: Response) {
  const groups = await publicContentService.getStandings();
  const payload: PublicStandingsResponse = { groups };

  res.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
  res.json(ok(payload));
}
