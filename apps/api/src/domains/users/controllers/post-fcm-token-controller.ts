import { registerFcmTokenInputSchema } from "@prode/shared";
import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { registerFcmToken } from "../use-cases/register-fcm-token";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postFcmTokenController(req: Request, res: Response) {
  const input = parseBody(registerFcmTokenInputSchema, req.body);
  await registerFcmToken((req as AuthenticatedRequest).auth, input);
  res.json(ok({ ok: true as const }));
}
