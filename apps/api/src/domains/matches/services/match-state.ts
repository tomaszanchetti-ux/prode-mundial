import type { MatchStatus, PredictionStatus } from "@prode/shared";
import type { StoredMatch, StoredPrediction } from "../types";

export type MatchFunctionalState =
  | "EDITABLE"
  | "LOCKED_PENDING"
  | "LIVE_LOCKED"
  | "FINISHED_PENDING_SCORING"
  | "SCORED";

export type PredictionLifecycleState = "draft" | "locked" | "scored";

export type DerivedMatchState = {
  publicStatus: MatchStatus;
  matchState: MatchFunctionalState;
  predictionLifecycleState: PredictionLifecycleState | null;
  predictionStatus: PredictionStatus;
  isEditable: boolean;
  isLocked: boolean;
  isFinished: boolean;
  isScored: boolean;
};

export function normalizeMatchStatus(status: StoredMatch["status"]): MatchStatus {
  return status === "corrected" ? "finished" : status;
}

function toDateValue(timestamp: string) {
  return new Date(timestamp).getTime();
}

function hasReachedKickoff(match: StoredMatch, now: Date) {
  return toDateValue(match.kickoffAt) <= now.getTime();
}

export function deriveMatchFunctionalState(match: StoredMatch, now = new Date()): MatchFunctionalState {
  const publicStatus = normalizeMatchStatus(match.status);
  const kickoffReached = hasReachedKickoff(match, now);

  if (publicStatus === "finished") {
    return match.isScored ? "SCORED" : "FINISHED_PENDING_SCORING";
  }

  if (publicStatus === "live") {
    return "LIVE_LOCKED";
  }

  if (!kickoffReached && !match.isLocked) {
    return "EDITABLE";
  }

  return "LOCKED_PENDING";
}

export function derivePredictionLifecycleState(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  now = new Date()
): PredictionLifecycleState | null {
  if (!prediction) {
    return null;
  }

  const matchState = deriveMatchFunctionalState(match, now);

  if (prediction.isScored || (matchState === "SCORED" && prediction.pointsAwarded >= 0)) {
    return "scored";
  }

  if (matchState === "EDITABLE") {
    return "draft";
  }

  return "locked";
}

export function derivePredictionStatus(
  match: StoredMatch,
  prediction: StoredPrediction | null,
  now = new Date()
): PredictionStatus {
  const publicStatus = normalizeMatchStatus(match.status);
  const predictionLifecycleState = derivePredictionLifecycleState(match, prediction, now);

  if (predictionLifecycleState === "scored") {
    return "scored";
  }

  if (predictionLifecycleState === "draft") {
    return "saved_editable";
  }

  if (predictionLifecycleState === "locked") {
    return "locked_unscored";
  }

  if (publicStatus !== "scheduled" && publicStatus !== "finished") {
    return "void";
  }

  return "empty";
}

export function deriveMatchState(match: StoredMatch, prediction: StoredPrediction | null, now = new Date()): DerivedMatchState {
  const publicStatus = normalizeMatchStatus(match.status);
  const matchState = deriveMatchFunctionalState(match, now);
  const predictionLifecycleState = derivePredictionLifecycleState(match, prediction, now);
  const predictionStatus = derivePredictionStatus(match, prediction, now);

  return {
    publicStatus,
    matchState,
    predictionLifecycleState,
    predictionStatus,
    isEditable: matchState === "EDITABLE",
    isLocked: matchState !== "EDITABLE",
    isFinished: publicStatus === "finished",
    isScored: matchState === "SCORED"
  };
}
