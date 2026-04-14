import type { MacroGroupId } from "./macro-picks";

export type MacroGroupResult = {
  firstTeamId: string;
  secondTeamId: string;
};

export type MacroTournamentResults = {
  groups: Record<MacroGroupId, MacroGroupResult>;
  finalists: [string, string];
  champion: string;
};
