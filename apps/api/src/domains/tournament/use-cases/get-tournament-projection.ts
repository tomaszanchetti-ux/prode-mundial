import type { TournamentProjectionResponse } from "@prode/shared";
import { tuMundialService } from "../services/tu-mundial-service";

export function getTournamentProjection(
  userId: string,
  now = new Date()
): Promise<TournamentProjectionResponse> {
  return tuMundialService.getTournamentProjectionForUser(userId, now);
}
