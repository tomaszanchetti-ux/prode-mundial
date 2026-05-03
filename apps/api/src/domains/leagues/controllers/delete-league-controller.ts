import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { deleteLeague } from "../use-cases/delete-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function deleteLeagueController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).auth.userId;
  const leagueId = String(req.params.leagueId);

  await deleteLeague(userId, leagueId);
  res.status(200).json(ok({ leagueId, deleted: true }));
}
