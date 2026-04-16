import type { MatchDetail, MatchSummary } from "@prode/shared";

type EditableMatch = Pick<MatchSummary, "deadlineAt" | "isEditable" | "status"> | Pick<MatchDetail, "deadlineAt" | "isEditable" | "status">;
type PredictionWindowMatch = EditableMatch & Pick<MatchSummary, "predictionOpensAt">;

export function canEditPrediction(match: EditableMatch) {
  return match.isEditable;
}

export function isPredictionWindowNotOpen(match: PredictionWindowMatch, now = new Date()) {
  return match.status === "scheduled" && !match.isEditable && new Date(match.predictionOpensAt).getTime() > now.getTime();
}
