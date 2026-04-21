import type { Request, Response } from "express";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ok } from "../../../server/http/respond";
import { matchesQueryService } from "../services/matches-query-service";

type AuthenticatedRequest = Request & {
  auth: AuthContext;
  params: {
    matchId: string;
  };
};

export async function getMatchDetailController(req: Request, res: Response) {
  const detail = await matchesQueryService.getMatchDetailForUser(
    (req as AuthenticatedRequest).auth.userId,
    (req as AuthenticatedRequest).params.matchId
  );

  res.json(ok(detail));
}
