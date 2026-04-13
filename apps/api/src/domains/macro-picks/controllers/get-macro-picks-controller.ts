import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { macroPicksService } from "../services/macro-picks-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getMacroPicksController(req: Request, res: Response) {
  const result = await macroPicksService.getForUser((req as AuthenticatedRequest).auth.userId);
  res.status(200).json(ok(result));
}
