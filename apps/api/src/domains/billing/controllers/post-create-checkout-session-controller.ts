import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { createCheckoutSession } from "../use-cases/create-checkout-session";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postCreateCheckoutSessionController(req: Request, res: Response) {
  const auth = (req as AuthenticatedRequest).auth;
  const result = await createCheckoutSession({
    userId: auth.userId,
    email: auth.email
  });
  res.status(200).json(ok(result));
}
