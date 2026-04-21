import type { Request, Response } from "express";
import { joinLeagueInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { joinLeague } from "../use-cases/join-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postJoinLeagueController(req: Request, res: Response) {
  const input = parseBody(joinLeagueInputSchema, req.body);
  const result = await joinLeague((req as AuthenticatedRequest).auth.userId, input);
  res.status(201).json(ok(result));
}
