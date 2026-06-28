import { ApiError } from "../../../server/errors/api-error";
import type { StoredMatch, StoredPrediction } from "../types";
import { getPredictionDeadlineAt } from "./match-state";
import type { TournamentContext } from "./match-payloads";

export type ValidatedPredictionInput = {
  homeScorePred: number;
  awayScorePred: number;
  advancesTeamPred: string | null;
};

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value);
}

function resolveEditableDeadline(match: StoredMatch) {
  return getPredictionDeadlineAt(match).getTime();
}

function assertValidScore(value: unknown, fieldName: "homeScorePred" | "awayScorePred") {
  if (!isFiniteInteger(value) || value < 0) {
    throw new ApiError(400, "INVALID_SCORE", `${fieldName} must be an integer greater than or equal to zero.`, {
      field: fieldName
    });
  }

  return value;
}

export function assertMatchPredictionEditable(
  match: StoredMatch,
  now = new Date(),
  context?: TournamentContext
) {
  if (match.isLocked || match.status !== "scheduled" || resolveEditableDeadline(match) <= now.getTime()) {
    throw new ApiError(409, "MATCH_LOCKED", "This match is locked and cannot be edited anymore.", {
      matchId: match.matchId,
      kickoffAt: match.kickoffAt,
      predictionDeadlineAt: getPredictionDeadlineAt(match).toISOString()
    });
  }

  // Progressive phase unlock: a knock-out match is predictable only once its
  // upstream round has closed officially (at which point bracket-hydration
  // backfills homeTeamId / awayTeamId from the prior round's winners). If the
  // teams are still unresolved, the phase is gated regardless of kickoff.
  const isKnockoutStage = match.stage !== "group";
  const hasBothTeams = match.homeTeamId !== null && match.awayTeamId !== null;

  if (isKnockoutStage && !hasBothTeams) {
    throw new ApiError(
      409,
      "PHASE_LOCKED",
      "This phase has not unlocked yet — the upstream round must close first.",
      {
        matchId: match.matchId,
        stage: match.stage,
        homeSlot: match.homeSlot ?? null,
        awaySlot: match.awaySlot ?? null
      }
    );
  }

  // Phase CLOSE gate: once every match in this stage is finished, predictions
  // for the stage are sealed even if a specific match's individual deadline
  // hasn't been reached. Prevents stragglers from being predicted post-phase.
  if (context?.stageCompletion?.[match.stage]) {
    throw new ApiError(
      409,
      "PHASE_CLOSED",
      "This phase is already closed — every match has finished.",
      {
        matchId: match.matchId,
        stage: match.stage
      }
    );
  }
}

export function assertPredictionOwnership(prediction: StoredPrediction, userId: string) {
  if (prediction.userId !== userId) {
    throw new ApiError(403, "MATCH_NOT_EDITABLE", "This prediction does not belong to the authenticated user.", {
      predictionId: prediction.predictionId,
      userId
    });
  }
}

export function validatePredictionInput(
  match: StoredMatch,
  input: unknown,
  now = new Date(),
  context?: TournamentContext
): ValidatedPredictionInput {
  assertMatchPredictionEditable(match, now, context);

  if (typeof input !== "object" || input === null) {
    throw new ApiError(400, "INVALID_SCORE", "Prediction input must be an object.");
  }

  const record = input as Record<string, unknown>;
  const homeScorePred = assertValidScore(record.homeScorePred, "homeScorePred");
  const awayScorePred = assertValidScore(record.awayScorePred, "awayScorePred");
  const advancesTeamPred = resolveAdvancesTeamPred(match, homeScorePred, awayScorePred, record.advancesTeamPred);

  return {
    homeScorePred,
    awayScorePred,
    advancesTeamPred
  };
}

/**
 * "Quién pasa" solo aplica en knockouts cuando la predicción es empate (allí se
 * define por penales). En cualquier otro caso (grupos, o marcador no empatado)
 * el campo se ignora y se persiste como null para mantener la data limpia.
 *
 * Cuando aplica, es OBLIGATORIO y debe ser uno de los dos equipos del partido.
 */
function resolveAdvancesTeamPred(
  match: StoredMatch,
  homeScorePred: number,
  awayScorePred: number,
  rawValue: unknown
): string | null {
  const isKnockout = match.stage !== "group";
  const isDraw = homeScorePred === awayScorePred;

  if (!isKnockout || !isDraw) {
    return null;
  }

  if (typeof rawValue !== "string" || rawValue.length === 0) {
    throw new ApiError(
      400,
      "ADVANCER_REQUIRED",
      "Predicting a draw in a knock-out requires choosing which team advances.",
      { matchId: match.matchId, stage: match.stage }
    );
  }

  if (rawValue !== match.homeTeamId && rawValue !== match.awayTeamId) {
    throw new ApiError(
      400,
      "INVALID_ADVANCER",
      "The advancing team must be one of the two teams in this match.",
      {
        matchId: match.matchId,
        advancesTeamPred: rawValue,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId
      }
    );
  }

  return rawValue;
}
