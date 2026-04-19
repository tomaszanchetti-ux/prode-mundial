import type { Request, Response } from "express";
import { saveSubChampionPickInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { subChampionPickService } from "../services/sub-champion-service";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function putSubChampionController(req: Request, res: Response) {
  const input = parseBody(saveSubChampionPickInputSchema, req.body);
  const result = await subChampionPickService.saveForUser((req as AuthenticatedRequest).auth.userId, input);
  res.status(200).json(ok(result));
}
