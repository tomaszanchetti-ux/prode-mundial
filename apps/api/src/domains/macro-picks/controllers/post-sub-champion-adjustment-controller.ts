import type { Request, Response } from "express";
import { adjustSubChampionInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { subChampionPickService } from "../services/sub-champion-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postSubChampionAdjustmentController(req: Request, res: Response) {
  const input = parseBody(adjustSubChampionInputSchema, req.body);
  const result = await subChampionPickService.adjustForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
