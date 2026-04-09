import type { Request, Response } from "express";
import { saveMatchPredictionInputSchema } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { ApiError } from "../../../server/errors/api-error";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { matchesRepository } from "../repositories/matches-repository";
import { predictionsRepository } from "../repositories/predictions-repository";
import { toSaveMatchPredictionResponse } from "../services/match-payloads";
import { validatePredictionInput } from "../services/prediction-domain";

type AuthenticatedRequest = Request & {
  auth: AuthContext;
  params: {
    matchId: string;
  };
};

export async function putMatchPredictionController(req: Request, res: Response) {
  const authenticatedRequest = req as AuthenticatedRequest;
  const input = parseBody(saveMatchPredictionInputSchema, req.body);
  const match = await matchesRepository.getMatchById(authenticatedRequest.params.matchId);

  if (!match) {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Match missing.", {
      matchId: authenticatedRequest.params.matchId
    });
  }

  const validatedInput = validatePredictionInput(match, input);
  const prediction = await predictionsRepository.upsertPrediction(
    authenticatedRequest.auth.userId,
    match.matchId,
    validatedInput
  );

  res.json(ok(toSaveMatchPredictionResponse(match, prediction)));
}
