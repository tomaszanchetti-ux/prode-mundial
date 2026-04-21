import type { Request, Response } from "express";
import { saveBestPlayerPickInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { bestPlayerPickService } from "../services/best-player-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function putBestPlayerController(req: Request, res: Response) {
  const input = parseBody(saveBestPlayerPickInputSchema, req.body);
  const result = await bestPlayerPickService.saveForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
