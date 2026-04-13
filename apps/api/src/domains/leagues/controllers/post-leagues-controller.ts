import type { Request, Response } from "express";
import { createLeagueInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { createLeague } from "../use-cases/create-league";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function postLeaguesController(req: Request, res: Response) {
  const input = parseBody(createLeagueInputSchema, req.body);
  const result = await createLeague((req as AuthenticatedRequest).auth.userId, input);
  res.status(201).json(ok(result));
}
