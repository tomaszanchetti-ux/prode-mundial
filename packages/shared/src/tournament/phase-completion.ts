/**
 * Pure helpers to determine whether a tournament phase (group stage, R32,
 * R16, etc.) is fully completed — i.e. every match in that stage has been
 * played to completion (`status === "finished"`).
 *
 * Used as the CLOSE gate for prediction editability: once all matches of a
 * phase are finished, predictions for that phase should be locked even if a
 * specific match's individual T-60min deadline hasn't been reached yet.
 *
 * Complementary to `phaseUnlocks` (the OPEN gate from full-hydration-planner)
 * which gates the start of a phase. This helper gates the end.
 */

import type { MatchStage } from "../contracts/matches";

export type PhaseCompletionMatch = {
  stage: string;
  status: string;
};

export type StageCompletionMap = Partial<Record<MatchStage, boolean>>;

const FINISHED_STATUS = "finished";

/**
 * Returns true if there is at least one match for the given stage AND every
 * match of that stage has `status === "finished"`. An empty stage returns
 * false (we cannot say a phase is complete if it has no matches).
 */
export function isPhaseComplete(stage: MatchStage, matches: PhaseCompletionMatch[]): boolean {
  let seen = 0;
  for (const match of matches) {
    if (match.stage !== stage) continue;
    if (match.status !== FINISHED_STATUS) return false;
    seen += 1;
  }
  return seen > 0;
}

/**
 * Computes completion status for every stage present in the input. Stages
 * with no matches are absent from the map (not `false`), so callers can
 * distinguish "no matches" from "incomplete".
 */
export function computeStageCompletion(matches: PhaseCompletionMatch[]): StageCompletionMap {
  const counts = new Map<string, { total: number; finished: number }>();
  for (const match of matches) {
    const current = counts.get(match.stage) ?? { total: 0, finished: 0 };
    current.total += 1;
    if (match.status === FINISHED_STATUS) current.finished += 1;
    counts.set(match.stage, current);
  }

  const result: StageCompletionMap = {};
  for (const [stage, { total, finished }] of counts) {
    result[stage as MatchStage] = total > 0 && finished === total;
  }
  return result;
}
