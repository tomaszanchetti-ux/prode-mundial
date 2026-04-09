import { updateProfileInputSchema } from "@prode/shared";
import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { updateMe } from "../use-cases/update-me";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function patchMeController(req: Request, res: Response) {
  const input = parseBody(updateProfileInputSchema, req.body);
  const profile = await updateMe((req as AuthenticatedRequest).auth, input);
  res.json(ok(profile));
}
