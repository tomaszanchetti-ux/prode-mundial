import type { PreTournamentSummary } from "@prode/shared";
import { preTournamentSummaryService } from "../services/pre-tournament-summary-service";

export function getPreTournamentSummary(userId: string, now = new Date()): Promise<PreTournamentSummary> {
  return preTournamentSummaryService.getSummaryForUser(userId, now);
}
