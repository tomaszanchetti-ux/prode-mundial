import type { Request, Response } from "express";
import type { PublicTeamListResponse } from "@prode/shared";
import { ok } from "../../../server/http/respond";
import { publicContentService } from "../services/public-content-service";

export async function getPublicTeamsController(_req: Request, res: Response) {
  const items = await publicContentService.listTeams();
  const payload: PublicTeamListResponse = { items };

  // Team roster/metadata changes rarely → cache longer than live fixtures.
  res.set("Cache-Control", "public, max-age=600, s-maxage=600, stale-while-revalidate=1800");
  res.json(ok(payload));
}
