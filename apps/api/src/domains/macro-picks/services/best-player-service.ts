import {
  getBestPlayerById,
  resolveAliveTeamsAfterGroups,
  resolvePickWindow,
  type AdjustBestPlayerInput,
  type AdjustBestPlayerResponse,
  type BestPlayerPickResponse,
  type BestPlayerPickStatus,
  type PickWindowResolution,
  type SaveBestPlayerPickInput,
  type SaveBestPlayerPickResponse
} from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import type { StoredMatch } from "../../matches/types";
import { tuMundialService } from "../../tournament/services/tu-mundial-service";
import { bestPlayerPicksRepository } from "../repositories/best-player-picks-repository";
import type { StoredBestPlayerPick } from "../types";

// ── Schedule helpers ────────────────────────────────────
//
// Reutiliza el mismo wrapper que champion/sub-champion (resolvePickWindow).
// La ventana A/B/closed es idéntica: la diferencia está solo en qué pick se
// modifica, no en cuándo.

type BestPlayerSchedule = {
  initialDeadlineAt: string | null;
  adjustmentWindowOpensAt: string | null;
  adjustmentWindowClosesAt: string | null;
  initialLocked: boolean;
  adjustmentWindowOpen: boolean;
  pickWindow: PickWindowResolution;
};

function compareKickoff(left: StoredMatch, right: StoredMatch) {
  const byKickoff = left.kickoffAt.localeCompare(right.kickoffAt);
  if (byKickoff !== 0) return byKickoff;
  return left.matchId.localeCompare(right.matchId);
}

function getBestPlayerSchedule(matches: StoredMatch[], now: Date): BestPlayerSchedule {
  const sortedMatches = [...matches].sort(compareKickoff);
  const firstMatch = sortedMatches[0];

  const emptyResolution: PickWindowResolution = { window: "closed", closesAt: null, pointValue: 0 };

  if (!firstMatch) {
    return {
      initialDeadlineAt: null,
      adjustmentWindowOpensAt: null,
      adjustmentWindowClosesAt: null,
      initialLocked: false,
      adjustmentWindowOpen: false,
      pickWindow: emptyResolution
    };
  }

  const groupMatches = sortedMatches.filter((match) => match.stage === "group");
  const knockoutMatches = sortedMatches.filter((match) => match.stage !== "group");
  const lastGroupMatch = groupMatches.at(-1) ?? null;
  const firstKnockoutMatch = knockoutMatches[0] ?? null;
  const areGroupsOfficiallyClosed =
    groupMatches.length > 0 && groupMatches.every((match) => match.status === "finished" || match.status === "corrected");

  const pickWindow = resolvePickWindow({
    now,
    inauguralKickoffAt: firstMatch.kickoffAt,
    firstKnockoutKickoffAt: firstKnockoutMatch?.kickoffAt ?? null,
    areGroupsOfficiallyClosed
  });

  const LOCK_OFFSET_MS = 60 * 60 * 1000;
  const initialDeadlineAt = new Date(new Date(firstMatch.kickoffAt).getTime() - LOCK_OFFSET_MS).toISOString();
  const adjustmentWindowClosesAt = firstKnockoutMatch
    ? new Date(new Date(firstKnockoutMatch.kickoffAt).getTime() - LOCK_OFFSET_MS).toISOString()
    : null;

  return {
    initialDeadlineAt,
    adjustmentWindowOpensAt: lastGroupMatch?.kickoffAt ?? null,
    adjustmentWindowClosesAt,
    initialLocked: pickWindow.window !== "A",
    adjustmentWindowOpen: pickWindow.window === "B",
    pickWindow
  };
}

// ── Status derivation ───────────────────────────────────

function deriveStatus(
  stored: StoredBestPlayerPick | null,
  schedule: BestPlayerSchedule
): BestPlayerPickStatus {
  if (stored?.isAdjusted) return "adjusted";
  if (schedule.adjustmentWindowOpen && stored?.isLocked && stored.bestPlayerId && !stored.isAdjusted) {
    return "adjustment_available";
  }
  if (schedule.initialLocked && stored?.bestPlayerId) return "locked";
  if (stored?.bestPlayerId) return "picked";
  return "empty";
}

function toResponse(
  stored: StoredBestPlayerPick | null,
  schedule: BestPlayerSchedule
): BestPlayerPickResponse {
  const status = deriveStatus(stored, schedule);
  return {
    status,
    bestPlayerId: stored?.bestPlayerId ?? null,
    adjustedBestPlayerId: stored?.adjustedBestPlayerId ?? null,
    initialDeadlineAt: schedule.initialDeadlineAt,
    adjustmentWindowOpensAt: schedule.adjustmentWindowOpensAt,
    adjustmentWindowClosesAt: schedule.adjustmentWindowClosesAt,
    isLocked: schedule.initialLocked || Boolean(stored?.isAdjusted),
    isAdjustmentWindowOpen: schedule.adjustmentWindowOpen,
    scoringResult: null,
    pickWindow: schedule.pickWindow.window,
    pickWindowClosesAt: schedule.pickWindow.closesAt,
    pickWindowPointValue: schedule.pickWindow.pointValue
  };
}

// ── Guards ──────────────────────────────────────────────

function assertValidPlayerOrThrow(playerId: string): void {
  if (!getBestPlayerById(playerId)) {
    throw new ApiError(
      409,
      "BEST_PLAYER_INVALID",
      "El jugador seleccionado no existe en el roster del Balón de Oro."
    );
  }
}

async function assertPlayerTeamAliveOrThrow(userId: string, playerId: string, now: Date): Promise<void> {
  const player = getBestPlayerById(playerId);
  if (!player) return; // already validated upstream
  const projection = await tuMundialService.getTournamentProjectionForUser(userId, now);
  const alive = resolveAliveTeamsAfterGroups(projection.bracket);
  // Si el bracket R32 aún no tiene teams hidratados (alive vacío), no
  // bloqueamos — es señal de que la hidratación post-grupos no está lista
  // todavía en este backend. La UX client-side ya filtra pre-selección.
  if (alive.size === 0) return;
  if (!alive.has(player.teamId)) {
    throw new ApiError(
      409,
      "BEST_PLAYER_TEAM_ELIMINATED",
      "El equipo del jugador fue eliminado en fase de grupos. Elegí otro jugador."
    );
  }
}

// ── Service ─────────────────────────────────────────────

export class BestPlayerPickService {
  async getForUser(userId: string, now = new Date()): Promise<BestPlayerPickResponse> {
    const [stored, matches] = await Promise.all([
      bestPlayerPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);

    const schedule = getBestPlayerSchedule(matches, now);
    return toResponse(stored, schedule);
  }

  async saveForUser(
    userId: string,
    input: SaveBestPlayerPickInput,
    now = new Date()
  ): Promise<SaveBestPlayerPickResponse> {
    const matches = await matchesRepository.listMatches();
    const schedule = getBestPlayerSchedule(matches, now);

    if (schedule.initialLocked) {
      throw new ApiError(409, "BEST_PLAYER_PICK_LOCKED", "Best-player pick window A is closed.");
    }

    const nextPlayerId = input.bestPlayerId.trim();
    assertValidPlayerOrThrow(nextPlayerId);

    const existing = await bestPlayerPicksRepository.getByUserId(userId);
    const nowIso = now.toISOString();

    const nextPick: StoredBestPlayerPick = {
      userId,
      bestPlayerId: nextPlayerId,
      adjustedBestPlayerId: existing?.adjustedBestPlayerId ?? null,
      isLocked: false,
      isAdjusted: existing?.isAdjusted ?? false,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      lockedAt: existing?.lockedAt ?? null,
      adjustedAt: existing?.adjustedAt ?? null
    };

    await bestPlayerPicksRepository.upsert(nextPick);

    return { ok: true, status: "picked" };
  }

  async adjustForUser(
    userId: string,
    input: AdjustBestPlayerInput,
    now = new Date()
  ): Promise<AdjustBestPlayerResponse> {
    const [existing, matches] = await Promise.all([
      bestPlayerPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);

    const schedule = getBestPlayerSchedule(matches, now);

    if (!existing?.bestPlayerId) {
      throw new ApiError(
        409,
        "BEST_PLAYER_PICK_NOT_FOUND",
        "No hay jugador salvado para ajustar."
      );
    }

    if (!schedule.initialLocked) {
      throw new ApiError(
        409,
        "BEST_PLAYER_ADJUSTMENT_NOT_AVAILABLE",
        "El ajuste se habilita recien cuando cierran los grupos."
      );
    }

    if (!schedule.adjustmentWindowOpen) {
      throw new ApiError(
        409,
        "BEST_PLAYER_ADJUSTMENT_WINDOW_CLOSED",
        "La ventana de ajuste del Balón de Oro esta cerrada."
      );
    }

    if (existing.isAdjusted) {
      throw new ApiError(
        409,
        "BEST_PLAYER_ADJUSTMENT_ALREADY_USED",
        "Ya usaste tu ajuste del Balón de Oro."
      );
    }

    const nextPlayerId = input.bestPlayerId.trim();
    assertValidPlayerOrThrow(nextPlayerId);
    await assertPlayerTeamAliveOrThrow(userId, nextPlayerId, now);

    const nowIso = now.toISOString();

    const nextPick: StoredBestPlayerPick = {
      ...existing,
      adjustedBestPlayerId: nextPlayerId,
      isLocked: true,
      isAdjusted: true,
      adjustedAt: nowIso,
      updatedAt: nowIso,
      lockedAt: existing.lockedAt ?? schedule.initialDeadlineAt
    };

    await bestPlayerPicksRepository.upsert(nextPick);

    return {
      ok: true,
      status: "adjusted",
      penaltyNotice: "Si aciertas el Balón de Oro ajustado, sumas 10 pts en vez de 25."
    };
  }
}

export const bestPlayerPickService = new BestPlayerPickService();
