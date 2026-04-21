import type { TournamentProjectionBracket } from "../contracts/tournament";
import { classifyTeamBracketHalves } from "./bracket-halves";
import { resolveAliveTeamsAfterGroups } from "./alive-teams";

/**
 * EPIC 19 — Detector puro de warnings para los 3 picks macro
 * (Campeón, Sub-Campeón, Balón de Oro).
 *
 * Filosofía: "warn-don't-block". Estos warnings son visibles en el front
 * como banners persistentes; no impiden guardar el pick. La única regla
 * hard-block cross-pick es cross-uniqueness (Campeón ≠ Sub-Campeón), que se
 * valida separado en frontend + backend.
 *
 * Casos detectados:
 *   1. `champion_eliminated`   — equipo Campeón salvado ya no está vivo.
 *   2. `sub_champion_eliminated` — equipo Sub-Campeón salvado ya no está vivo.
 *   3. `best_player_eliminated` — equipo del jugador salvado ya no está vivo.
 *   4. `same_half` — Campeón y Sub-Campeón quedan en la misma mitad del
 *                    bracket post-grupos. Emitido una sola vez (no duplicado
 *                    por mitad). El front lo renderea en ambas cards.
 *
 * Nota: el warning 4 requiere que ambos picks estén seteados Y que ambos
 * teams estén resolvibles a una mitad no-neutral; si alguno no lo está, no
 * se emite (equivale a "no sabemos todavía").
 */

export type MacroPickWarningKind =
  | "champion_eliminated"
  | "sub_champion_eliminated"
  | "best_player_eliminated"
  | "same_half";

export type MacroPickWarning = {
  kind: MacroPickWarningKind;
  /** Pick(s) afectado(s). `same_half` afecta a ambos. */
  picks: Array<"champion" | "sub_champion" | "best_player">;
};

export type DetectMacroPickWarningsInput = {
  bracket: TournamentProjectionBracket;
  championTeamId: string | null;
  subChampionTeamId: string | null;
  /** teamId del jugador del Balón de Oro salvado (resolverlo via roster). */
  bestPlayerTeamId: string | null;
  /**
   * Solo emitir warnings "eliminated" cuando los grupos estén oficialmente
   * cerrados. Antes de eso, el bracket R32 es una proyección del user y no
   * refleja eliminación real.
   */
  areGroupsOfficiallyClosed: boolean;
};

export function detectMacroPickWarnings(
  input: DetectMacroPickWarningsInput
): MacroPickWarning[] {
  const warnings: MacroPickWarning[] = [];
  const { bracket, championTeamId, subChampionTeamId, bestPlayerTeamId, areGroupsOfficiallyClosed } = input;

  if (areGroupsOfficiallyClosed) {
    const alive = resolveAliveTeamsAfterGroups(bracket);
    if (alive.size > 0) {
      if (championTeamId && !alive.has(championTeamId)) {
        warnings.push({ kind: "champion_eliminated", picks: ["champion"] });
      }
      if (subChampionTeamId && !alive.has(subChampionTeamId)) {
        warnings.push({ kind: "sub_champion_eliminated", picks: ["sub_champion"] });
      }
      if (bestPlayerTeamId && !alive.has(bestPlayerTeamId)) {
        warnings.push({ kind: "best_player_eliminated", picks: ["best_player"] });
      }
    }
  }

  if (championTeamId && subChampionTeamId && championTeamId !== subChampionTeamId) {
    const halves = classifyTeamBracketHalves(bracket);
    const champHalf = halves.get(championTeamId);
    const subHalf = halves.get(subChampionTeamId);
    if (
      champHalf &&
      subHalf &&
      champHalf !== "neutral" &&
      subHalf !== "neutral" &&
      champHalf === subHalf
    ) {
      warnings.push({ kind: "same_half", picks: ["champion", "sub_champion"] });
    }
  }

  return warnings;
}
