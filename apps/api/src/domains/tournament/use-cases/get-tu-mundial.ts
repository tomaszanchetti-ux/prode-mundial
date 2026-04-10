import type { TuMundialResponse } from "@prode/shared";
import { tuMundialService } from "../services/tu-mundial-service";

export function getTuMundial(userId: string, now = new Date()): Promise<TuMundialResponse> {
  return tuMundialService.getTuMundialForUser(userId, now);
}
