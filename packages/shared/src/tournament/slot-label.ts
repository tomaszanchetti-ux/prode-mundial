/**
 * Converts a bracket slot identifier into a human-readable Spanish label.
 *
 * Supported slot grammar (same as bracket-simulator + r32-bracket-resolver):
 *   - "1A", "1B", …         → "Ganador Grupo A"
 *   - "2A", "2B", …         → "Segundo Grupo A"
 *   - "3ABCDF", "3CDEF", …  → "Mejor 3ero (A, B, C, D, F)"
 *   - "W<num>" (ej "W73")   → "Ganador del M73"
 *   - "WINNER_SF_1|2"       → "Ganador SF1"
 *   - "LOSER_SF_1|2"        → "Perdedor SF1"
 *
 * Falls back to the raw slot string if the pattern is not recognized.
 *
 * Pure function — no I/O, safe to call from server or client.
 */
export function buildSlotLabel(slot: string): string {
  const prefix = slot.slice(0, 1);
  const tail = slot.slice(1);

  if (prefix === "1") {
    return `Ganador Grupo ${tail}`;
  }

  if (prefix === "2") {
    return `Segundo Grupo ${tail}`;
  }

  if (prefix === "3") {
    return `Mejor 3ero (${tail.split("").join(", ")})`;
  }

  if (prefix === "W" && /^\d+$/.test(tail)) {
    return `Ganador del M${tail}`;
  }

  const semifinalReference = /^(WINNER|LOSER)_SF_(1|2)$/.exec(slot);

  if (semifinalReference) {
    const kind = semifinalReference[1] === "WINNER" ? "Ganador" : "Perdedor";
    return `${kind} SF${semifinalReference[2]}`;
  }

  return slot;
}
