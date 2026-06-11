import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../../server/errors/api-error";
import { ok } from "../../../server/http/respond";
import { parseBody } from "../../../server/http/validation";
import { matchesRepository } from "../repositories/matches-repository";
import { scoreMatch } from "../services/score-match";

const postMatchResultSchema = z.object({
  homeScore90: z.number().int().min(0),
  awayScore90: z.number().int().min(0),
  winnerTeamId: z.string().nullable().optional(),
  // Permite corregir un resultado ya puntuado (rescoring). El pipeline de
  // scoring asigna puntos (no incrementa) y reconstruye agregados desde cero,
  // así que re-ejecutarlo con el resultado corregido es seguro.
  force: z.boolean().optional()
});

type PostMatchResultInput = z.infer<typeof postMatchResultSchema>;

type AdminMatchRequest = Request & {
  params: { matchId: string };
};

export async function postMatchResultController(req: Request, res: Response) {
  const { matchId } = (req as AdminMatchRequest).params;
  const input: PostMatchResultInput = parseBody(postMatchResultSchema, req.body);

  const match = await matchesRepository.getMatchById(matchId);

  if (!match) {
    throw new ApiError(404, "MATCH_NOT_FOUND", "Match not found.", { matchId });
  }

  const isRescore = match.isScored;

  if (isRescore && input.force !== true) {
    throw new ApiError(409, "MATCH_LOCKED", "Match already scored. Pass force=true to rescore with a corrected result.", {
      matchId
    });
  }

  const nowIso = new Date().toISOString();

  // Determinar winnerTeamId
  let winnerTeamId: string | null = input.winnerTeamId ?? null;

  if (!winnerTeamId) {
    if (input.homeScore90 > input.awayScore90) {
      winnerTeamId = match.homeTeamId;
    } else if (input.awayScore90 > input.homeScore90) {
      winnerTeamId = match.awayTeamId;
    }
  }

  // Actualizar match con resultado
  await matchesRepository.upsertMatch({
    ...match,
    status: "finished",
    homeScore90: input.homeScore90,
    awayScore90: input.awayScore90,
    winnerTeamId,
    isLocked: true,
    sourceProvider: "admin-manual",
    sourceLastSyncedAt: nowIso,
    updatedAt: nowIso
  });

  // Disparar scoring pipeline
  const scoringResult = await scoreMatch(matchId, nowIso);

  // Marcar como scored
  await matchesRepository.upsertMatch({
    ...match,
    status: "finished",
    homeScore90: input.homeScore90,
    awayScore90: input.awayScore90,
    winnerTeamId,
    isLocked: true,
    isScored: true,
    sourceProvider: "admin-manual",
    sourceLastSyncedAt: nowIso,
    updatedAt: nowIso
  });

  res.json(
    ok({
      matchId,
      homeScore90: input.homeScore90,
      awayScore90: input.awayScore90,
      winnerTeamId,
      rescored: isRescore,
      scoring: {
        predictionsProcessed: scoringResult.predictionsProcessed,
        affectedUsers: scoringResult.affectedUsers,
        affectedLeagues: scoringResult.affectedLeagues
      }
    })
  );
}
