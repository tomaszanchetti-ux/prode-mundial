import type { Request, Response } from "express";
import { adjustChampionInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { championPickService } from "../services/macro-picks-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postMacroAdjustmentController(req: Request, res: Response) {
  const input = parseBody(adjustChampionInputSchema, req.body);
  const result = await championPickService.adjustForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
