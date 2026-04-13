import type {
  MACRO_GROUP_IDS,
  MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL,
  MACRO_PICKS_STATUSES
} from "../constants/macro-picks";

export type MacroGroupId = (typeof MACRO_GROUP_IDS)[number];

export type MacroPicksStatus = (typeof MACRO_PICKS_STATUSES)[number];

export type MacroGroupPick = {
  firstTeamId: string;
  secondTeamId: string;
};

export type MacroGroupPicks = Partial<Record<MacroGroupId, MacroGroupPick>>;

export type MacroPicksCompletion = {
  groupsCompleted: number;
  groupsTotal: number;
  hasFinalists: boolean;
  hasChampion: boolean;
  percent: number;
};

export type MacroPicksAdjustmentWindow = {
  opensAt: string | null;
  closesAt: string | null;
};

export type MacroPicksResponse = {
  status: MacroPicksStatus;
  isLocked: boolean;
  adjustmentAvailable: boolean;
  adjustmentAlreadyUsed: boolean;
  initialDeadlineAt: string;
  adjustmentWindow: MacroPicksAdjustmentWindow;
  groupPicks: MacroGroupPicks;
  finalists: string[];
  champion: string | null;
  adjustedFinalists?: string[];
  adjustedChampion?: string | null;
  adjustmentConfirmedAt?: string | null;
  completion: MacroPicksCompletion;
};

export type SaveMacroPicksInput = {
  groupPicks: MacroGroupPicks;
  finalists: string[];
  champion: string | null;
};

export type SaveMacroPicksResponse = {
  status: MacroPicksStatus;
  savedAt: string;
  completionPercent: number;
};

export type ConfirmMacroAdjustmentInput = {
  finalists: string[];
  champion: string;
};

export type MacroPicksPenaltyModel = typeof MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL;

export type ConfirmMacroAdjustmentResponse = {
  status: Extract<MacroPicksStatus, "adjusted_locked">;
  adjustmentConfirmedAt: string;
  adjustedFinalists: string[];
  adjustedChampion: string;
  penaltyModel: MacroPicksPenaltyModel;
};
