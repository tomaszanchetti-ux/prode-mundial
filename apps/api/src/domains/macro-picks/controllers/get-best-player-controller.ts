import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { bestPlayerPickService } from "../services/best-player-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getBestPlayerController(req: Request, res: Response) {
  const result = await bestPlayerPickService.getForUser((req as AuthenticatedRequest).auth.userId);
  res.status(200).json(ok(result));
}
