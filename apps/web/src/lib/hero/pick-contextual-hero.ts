import type { MatchSummary } from "@prode/shared";
import { canEditPrediction } from "@/lib/matches/editability";

export type HeroSelectionMode = "predictions-first" | "live-first";

// "pending"      → el usuario tiene un match editable sin predicción (CTA: predecir)
// "up-to-date"   → no hay pendiente editable; mostramos el próximo cronológico o el live
export type HeroState = "pending" | "up-to-date";

export type ContextualHero = {
  match: MatchSummary;
  state: HeroState;
};

function pickPendingMatch(matches: MatchSummary[]): MatchSummary | null {
  return (
    matches.find(
      (match) => canEditPrediction(match) && match.predictionStatus === "empty"
    ) ?? null
  );
}

function pickLiveMatch(matches: MatchSummary[]): MatchSummary | null {
  return matches.find((match) => match.status === "live") ?? null;
}

function pickNextChronologicalMatch(
  matches: MatchSummary[],
  now: Date
): MatchSummary | null {
  const nowTs = now.getTime();
  const candidates = matches.filter(
    (match) =>
      match.status === "scheduled" && new Date(match.kickoffAt).getTime() > nowTs
  );
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  )[0];
}

export function pickContextualHeroMatch(
  matches: MatchSummary[],
  mode: HeroSelectionMode,
  now: Date = new Date()
): ContextualHero | null {
  if (mode === "live-first") {
    const live = pickLiveMatch(matches);
    if (live) return { match: live, state: "up-to-date" };
  }

  const pending = pickPendingMatch(matches);
  if (pending) return { match: pending, state: "pending" };

  const upcoming = pickNextChronologicalMatch(matches, now);
  if (upcoming) return { match: upcoming, state: "up-to-date" };

  return null;
}
