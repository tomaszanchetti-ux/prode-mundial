import type { Request, Response } from "express";
import { joinLeagueInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { isAdminEmail } from "../../../server/auth/admin-emails";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { joinLeague } from "../use-cases/join-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postJoinLeagueController(req: Request, res: Response) {
  const input = parseBody(joinLeagueInputSchema, req.body);
  const auth = (req as AuthenticatedRequest).auth;
  const result = await joinLeague(auth.userId, input, {
    bypassUserLimit: isAdminEmail(auth.email)
  });
  res.status(201).json(ok(result));
}
