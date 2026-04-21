import type { MatchStage } from "../contracts/matches";

/**
 * EPIC 19 Card 6 — Auto-derive Campeón + Sub-Campeón desde el match Final
 * (FIFA 2026: M104). Puro, testeable con fixtures sintéticos. Backend
 * invoca esto para evitar un script manual de upsert: apenas la Final
 * queda finalizada y con `winnerTeamId`, los resultados oficiales de
 * Campeón/Sub-Campeón quedan listos.
 *
 * Reglas:
 *   - Se considera solo matches `stage === "FINAL"`.
 *   - Match debe estar en estado finalizado (`status === "finished"` o
 *     `"corrected"` si el caller lo pasa como tal).
 *   - Debe haber `winnerTeamId` resuelto (requerido para knockouts aunque
 *     se haya decidido por penales).
 *   - Tanto home como away deben tener teamId asignado.
 *
 * Si alguna condición no se cumple, retorna null (el caller puede caer al
 * path manual / esperar a la próxima corrida del job).
 */

export type OfficialFinalMatchInput = {
  stage: MatchStage;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
};

export type OfficialFinalResults = {
  championTeamId: string;
  subChampionTeamId: string;
};

const FINISHED_STATUSES = new Set(["finished", "corrected"]);

export function resolveOfficialFinalResults(
  matches: readonly OfficialFinalMatchInput[]
): OfficialFinalResults | null {
  const final = matches.find((match) => match.stage === "FINAL");
  if (!final) return null;
  if (!FINISHED_STATUSES.has(final.status)) return null;
  if (!final.winnerTeamId) return null;
  if (!final.homeTeamId || !final.awayTeamId) return null;

  const champion = final.winnerTeamId;
  const runnerUp =
    champion === final.homeTeamId
      ? final.awayTeamId
      : champion === final.awayTeamId
        ? final.homeTeamId
        : null;

  if (!runnerUp) return null; // winnerTeamId inconsistente con home/away

  return { championTeamId: champion, subChampionTeamId: runnerUp };
}
