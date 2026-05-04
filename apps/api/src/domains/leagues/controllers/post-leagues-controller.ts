import type { Request, Response } from "express";
import { createLeagueInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { isAdminEmail } from "../../../server/auth/admin-emails";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { createLeague } from "../use-cases/create-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postLeaguesController(req: Request, res: Response) {
  const input = parseBody(createLeagueInputSchema, req.body);
  const auth = (req as AuthenticatedRequest).auth;
  const result = await createLeague(auth.userId, input, {
    bypassUserLimit: isAdminEmail(auth.email)
  });
  res.status(201).json(ok(result));
}
