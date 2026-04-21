import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import type { AuthContext } from "../../../server/auth/auth-context";
import { getTournamentProjection } from "../use-cases/get-tournament-projection";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getTournamentProjectionController(req: Request, res: Response) {
  const response = await getTournamentProjection((req as AuthenticatedRequest).auth.userId);
  res.json(ok(response));
}
