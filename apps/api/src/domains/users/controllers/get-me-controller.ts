import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import type { AuthContext } from "../../../server/auth/auth-context";
import { getMe } from "../use-cases/get-me";

type AuthenticatedRequest = Request & { auth: AuthContext };

export function getMeController(req: Request, res: Response) {
  const profile = getMe((req as AuthenticatedRequest).auth);
  res.json(ok(profile));
}
