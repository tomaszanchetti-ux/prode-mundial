import type { ChampionPickStatus } from "../constants/macro-picks";

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
