import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { getPoints } from "../use-cases/get-points";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getPointsController(req: Request, res: Response) {
  const result = await getPoints((req as AuthenticatedRequest).auth.userId);
  res.json(ok(result));
}

