import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { getLeagueStandings } from "../use-cases/get-league-standings";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getLeagueStandingsController(req: Request, res: Response) {
  const leagueId = Array.isArray(req.params.leagueId) ? req.params.leagueId[0] : req.params.leagueId;
  const result = await getLeagueStandings((req as AuthenticatedRequest).auth.userId, leagueId);
  res.json(ok(result));
}
