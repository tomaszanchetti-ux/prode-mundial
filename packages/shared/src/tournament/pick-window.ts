/**
 * Tournament pick windows (A / B) — pure resolver.
 *
 * Tournament-level picks (Campeón, Sub-Campeón, Balón de Oro) are editable
 * only during two windows:
 *
 *   Window A — from signup through 1h before the inaugural match kicks off.
 *              A correct pick submitted in A scores 25 pts.
 *
 *   Window B — from the moment groups close officially through 1h before the
 *              first R16 match kicks off. A pick submitted in B scores 10 pts
 *              (half-penalty for adjusting after seeing the group results).
 *
 *   Closed   — the gap between A and B (while groups are still in progress),
 *              plus everything after B. Pick is locked.
 *
 * This helper is the single source of truth for window state. It takes the
 * fixture-derived timestamps + the groups-closed flag and returns which
 * window is open, when it closes, and what point value is in play.
 */

export type TournamentPickWindow = "A" | "B" | "closed";

export const TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF = 60 as const;

export const PICK_WINDOW_POINT_VALUES = {
  A: 25,
  B: 10,
  closed: 0
} as const;

export type PickWindowInput = {
  /** Current clock — injected so the function stays pure / testable. */
  now: Date;
  /** Kick-off of the inaugural (first) match. ISO-8601. Null if schedule not seeded. */
  inauguralKickoffAt: string | null;
  /**
   * Kick-off of the first knock-out match (in FIFA 2026 that's R32 / 16avos —
   * the first non-group match on the schedule). ISO-8601. Null if knock-outs
   * not yet scheduled. Window B closes at this time − 1h.
   */
  firstKnockoutKickoffAt: string | null;
  /** True once every group-stage match is finalized (winner or draw locked in). */
  areGroupsOfficiallyClosed: boolean;
};

export type PickWindowResolution = {
  window: TournamentPickWindow;
  /** When the current window closes. Null when window is "closed". */
  closesAt: string | null;
  /** Points a correct pick earns if submitted now. 0 while closed. */
  pointValue: (typeof PICK_WINDOW_POINT_VALUES)[TournamentPickWindow];
};

const MS_PER_MINUTE = 60_000;

export function resolvePickWindow(input: PickWindowInput): PickWindowResolution {
  const { now, inauguralKickoffAt, firstKnockoutKickoffAt, areGroupsOfficiallyClosed } = input;

  if (!inauguralKickoffAt) {
    return { window: "closed", closesAt: null, pointValue: 0 };
  }

  const lockOffsetMs = TOURNAMENT_PICK_LOCK_MINUTES_BEFORE_KICKOFF * MS_PER_MINUTE;
  const nowMs = now.getTime();
  const windowACloseMs = new Date(inauguralKickoffAt).getTime() - lockOffsetMs;

  if (nowMs < windowACloseMs) {
    return {
      window: "A",
      closesAt: new Date(windowACloseMs).toISOString(),
      pointValue: PICK_WINDOW_POINT_VALUES.A
    };
  }

  if (!areGroupsOfficiallyClosed || !firstKnockoutKickoffAt) {
    // Post-A but either groups still in progress, or R16 not scheduled.
    return { window: "closed", closesAt: null, pointValue: 0 };
  }

  const windowBCloseMs = new Date(firstKnockoutKickoffAt).getTime() - lockOffsetMs;
  if (nowMs < windowBCloseMs) {
    return {
      window: "B",
      closesAt: new Date(windowBCloseMs).toISOString(),
      pointValue: PICK_WINDOW_POINT_VALUES.B
    };
  }

  return { window: "closed", closesAt: null, pointValue: 0 };
}
