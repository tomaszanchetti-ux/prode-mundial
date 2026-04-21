import type { Request, Response } from "express";
import { adjustBestPlayerInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { bestPlayerPickService } from "../services/best-player-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postBestPlayerAdjustmentController(req: Request, res: Response) {
  const input = parseBody(adjustBestPlayerInputSchema, req.body);
  const result = await bestPlayerPickService.adjustForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
