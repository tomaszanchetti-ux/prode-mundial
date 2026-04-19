import type { ChampionPickStatus } from "../constants/macro-picks";
import type { PickWindowResolution, TournamentPickWindow } from "../tournament/pick-window";

export type ChampionPickResponse = {
  status: ChampionPickStatus;
  championTeamId: string | null;
  adjustedChampionTeamId: string | null;
  initialDeadlineAt: string | null;
  adjustmentWindowOpensAt: string | null;
  adjustmentWindowClosesAt: string | null;
  isLocked: boolean;
  isAdjustmentWindowOpen: boolean;
  scoringResult: ChampionScoringResult | null;
  /**
   * EPIC 17 — tournament pick window resolution. Derived server-side from the
   * fixture + groups-closed flag. `window` is the source of truth for whether
   * the user can submit/adjust the pick right now.
   */
  pickWindow: TournamentPickWindow;
  pickWindowClosesAt: PickWindowResolution["closesAt"];
  pickWindowPointValue: PickWindowResolution["pointValue"];
};

export type ChampionScoringResult = {
  points: number;
  wasAdjusted: boolean;
};

export type SaveChampionPickInput = {
  championTeamId: string;
};

export type SaveChampionPickResponse = {
  ok: true;
  status: ChampionPickStatus;
};

export type AdjustChampionInput = {
  championTeamId: string;
};

export type AdjustChampionResponse = {
  ok: true;
  status: ChampionPickStatus;
  penaltyNotice: string;
};
