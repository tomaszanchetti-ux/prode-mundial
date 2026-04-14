import { z } from "zod";
import { MACRO_GROUP_IDS } from "../constants/macro-picks";

const macroGroupResultShape = Object.fromEntries(
  MACRO_GROUP_IDS.map((groupId) => [
    groupId,
    z.object({
      firstTeamId: z.string().trim().min(1),
      secondTeamId: z.string().trim().min(1)
    })
  ])
);

export const macroGroupResultSchema = z.object({
  firstTeamId: z.string().trim().min(1),
  secondTeamId: z.string().trim().min(1)
});

export const macroTournamentResultsSchema = z.object({
  groups: z.object(macroGroupResultShape),
  finalists: z.tuple([z.string().trim().min(1), z.string().trim().min(1)]),
  champion: z.string().trim().min(1)
});
