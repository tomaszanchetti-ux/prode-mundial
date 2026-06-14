import { z } from "zod";
import { PUBLIC_MATCH_LIST_FILTERS } from "../constants/matches";
import { matchStageSchema } from "./matches";

export const publicMatchListFilterSchema = z.enum(PUBLIC_MATCH_LIST_FILTERS);

export const publicMatchesQuerySchema = z.object({
  stage: matchStageSchema.optional(),
  filter: publicMatchListFilterSchema.optional()
});

export type PublicMatchListFilter = z.infer<typeof publicMatchListFilterSchema>;
export type PublicMatchesQueryInput = z.infer<typeof publicMatchesQuerySchema>;
