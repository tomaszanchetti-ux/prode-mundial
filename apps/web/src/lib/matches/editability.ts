import type { MatchDetail, MatchSummary } from "@prode/shared";
import { webConfig } from "@/config/app";

type EditableMatch = Pick<MatchSummary, "deadlineAt" | "isEditable" | "status"> | Pick<MatchDetail, "deadlineAt" | "isEditable" | "status">;
type PredictionWindowMatch = EditableMatch & Pick<MatchSummary, "predictionOpensAt">;

export function isLabPredictionEditable(match: EditableMatch, now = new Date()) {
  if (!webConfig.enableLabPredictions) {
    return false;
  }

  return match.status === "scheduled" && new Date(match.deadlineAt).getTime() > now.getTime();
}

export function canEditPrediction(match: EditableMatch, now = new Date()) {
  return match.isEditable || isLabPredictionEditable(match, now);
}

export function isPredictionWindowNotOpen(match: PredictionWindowMatch, now = new Date()) {
  return match.status === "scheduled" && !canEditPrediction(match, now) && new Date(match.predictionOpensAt).getTime() > now.getTime();
}
