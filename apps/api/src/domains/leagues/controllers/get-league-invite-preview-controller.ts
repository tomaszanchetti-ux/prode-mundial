import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import { getLeagueInvitePreview } from "../use-cases/get-league-invite-preview";

export async function getLeagueInvitePreviewController(req: Request, res: Response) {
  const inviteToken = Array.isArray(req.params.inviteToken) ? req.params.inviteToken[0] : req.params.inviteToken;
  const result = await getLeagueInvitePreview(inviteToken);
  res.json(ok(result));
}
