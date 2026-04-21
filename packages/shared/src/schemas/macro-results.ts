import { z } from "zod";

export const championResultSchema = z.object({
  championTeamId: z.string().trim().min(1)
});

export const subChampionResultSchema = z.object({
  subChampionTeamId: z.string().trim().min(1)
});

export const bestPlayerResultSchema = z.object({
  bestPlayerId: z.string().trim().min(1)
});
