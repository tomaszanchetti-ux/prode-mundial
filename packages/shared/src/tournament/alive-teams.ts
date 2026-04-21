import type { TournamentProjectionBracket } from "../contracts/tournament";

/**
 * EPIC 19 — Balón de Oro / Warnings post-grupos.
 *
 * Devuelve el conjunto de teamIds "vivos" tras la fase de grupos: los 32 que
 * avanzan a R32. La fuente de verdad es el bracket proyectado — cualquier
 * equipo cuyo teamId aparece en `bracket.round32` (home.team o away.team)
 * está vivo.
 *
 * Si el bracket todavía no está hidratado (pre-grupos o pre-R32), el Set
 * retornado queda vacío o parcial. Los callers deben considerar "Set vacío"
 * como "no se puede aplicar el filtro todavía" y no como "todos eliminados".
 */
export function resolveAliveTeamsAfterGroups(
  bracket: TournamentProjectionBracket
): Set<string> {
  const alive = new Set<string>();
  for (const match of bracket.round32) {
    const homeId = match.home.team?.teamId;
    const awayId = match.away.team?.teamId;
    if (homeId) alive.add(homeId);
    if (awayId) alive.add(awayId);
  }
  return alive;
}
