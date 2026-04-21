import type { BestPlayerPickStatus } from "../constants/macro-picks";
import type { ChampionScoringResult } from "./macro-picks";
import type { PickWindowResolution, TournamentPickWindow } from "../tournament/pick-window";

/**
 * EPIC 19 — Balón de Oro.
 *
 * Mirror estructural de `SubChampionPickResponse`. El target es un
 * `playerId` del mock roster (ver `BEST_PLAYER_ROSTER`). Scoring result
 * reutiliza `ChampionScoringResult` (misma forma: `{ points, wasAdjusted }`).
 */
export type BestPlayerPickResponse = {
  status: BestPlayerPickStatus;
  bestPlayerId: string | null;
  adjustedBestPlayerId: string | null;
  initialDeadlineAt: string | null;
  adjustmentWindowOpensAt: string | null;
  adjustmentWindowClosesAt: string | null;
  isLocked: boolean;
  isAdjustmentWindowOpen: boolean;
  scoringResult: ChampionScoringResult | null;
  pickWindow: TournamentPickWindow;
  pickWindowClosesAt: PickWindowResolution["closesAt"];
  pickWindowPointValue: PickWindowResolution["pointValue"];
};

export type SaveBestPlayerPickInput = {
  bestPlayerId: string;
};

export type SaveBestPlayerPickResponse = {
  ok: true;
  status: BestPlayerPickStatus;
};

export type AdjustBestPlayerInput = {
  bestPlayerId: string;
};

export type AdjustBestPlayerResponse = {
  ok: true;
  status: BestPlayerPickStatus;
  penaltyNotice: string;
};
