import type {
  ConfirmMacroAdjustmentResponse,
  MacroGroupPicks,
  MacroPicksResponse,
  MacroTournamentResults,
  MacroScoringLog,
  SaveMacroPicksResponse
} from "@prode/shared";

export type StoredMacroPrediction = {
  userId: string;
  groupPicks: MacroGroupPicks;
  finalists: string[] | null;
  champion: string | null;
  isLocked: boolean;
  isSubmitted: boolean;
  isAdjusted: boolean;
  adjustedAt: string | null;
  adjustedFinalists: string[] | null;
  adjustedChampion: string | null;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
};

export type MacroPicksView = MacroPicksResponse;

export type SaveMacroPicksView = SaveMacroPicksResponse;

export type ConfirmMacroAdjustmentView = ConfirmMacroAdjustmentResponse;

export type StoredMacroScoringLog = MacroScoringLog;

export type StoredMacroTournamentResults = MacroTournamentResults & {
  tournamentId: string;
  updatedAt: string;
};
