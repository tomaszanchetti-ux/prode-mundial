/**
 * Converts a bracket slot identifier into a human-readable Spanish label.
 *
 * Supported slot grammar (same as bracket-simulator + r32-bracket-resolver):
 *   - "1A", "1B", …         → "Ganador Grupo A"
 *   - "2A", "2B", …         → "Segundo Grupo A"
 *   - "3ABCDF", "3CDEF", …  → "Mejor 3ero (A, B, C, D, F)"
 *   - "W<num>" (ej "W73")   → "Ganador del M73"
 *   - "L<num>" (ej "L101")  → "Perdedor del M101" (usado por BRONZE)
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

  if (prefix === "L" && /^\d+$/.test(tail)) {
    return `Perdedor del M${tail}`;
  }

  return slot;
}
