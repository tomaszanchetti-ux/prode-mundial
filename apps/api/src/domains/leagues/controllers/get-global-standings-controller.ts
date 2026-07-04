import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { getGlobalStandings } from "../use-cases/get-global-standings";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getGlobalStandingsController(req: Request, res: Response) {
  const result = await getGlobalStandings((req as AuthenticatedRequest).auth.userId);
  res.json(ok(result));
}
