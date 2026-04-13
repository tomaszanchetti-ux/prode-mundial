import type { Request, Response } from "express";
import { confirmMacroAdjustmentInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { macroPicksService } from "../services/macro-picks-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postMacroAdjustmentController(req: Request, res: Response) {
  const input = parseBody(confirmMacroAdjustmentInputSchema, req.body);
  const result = await macroPicksService.confirmAdjustmentForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
