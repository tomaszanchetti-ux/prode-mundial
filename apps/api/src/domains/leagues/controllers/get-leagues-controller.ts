import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { listMyLeagues } from "../use-cases/list-my-leagues";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getLeaguesController(req: Request, res: Response) {
  const result = await listMyLeagues((req as AuthenticatedRequest).auth.userId);
  res.json(ok(result));
}

