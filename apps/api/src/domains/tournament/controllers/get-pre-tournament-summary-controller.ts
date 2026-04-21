import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import type { AuthContext } from "../../../server/auth/auth-context";
import { getPreTournamentSummary } from "../use-cases/get-pre-tournament-summary";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getPreTournamentSummaryController(req: Request, res: Response) {
  const summary = await getPreTournamentSummary((req as AuthenticatedRequest).auth.userId);
  res.json(ok(summary));
}
