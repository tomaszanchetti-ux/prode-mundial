import { z } from "zod";

export const championResultSchema = z.object({
  championTeamId: z.string().trim().min(1)
});
