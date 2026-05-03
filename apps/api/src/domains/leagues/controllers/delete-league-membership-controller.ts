import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { leaveLeague } from "../use-cases/leave-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function deleteLeagueMembershipController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).auth.userId;
  const leagueId = String(req.params.leagueId);

  await leaveLeague(userId, leagueId);
  res.status(200).json(ok({ leagueId, left: true }));
}
