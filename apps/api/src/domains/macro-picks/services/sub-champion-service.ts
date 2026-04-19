import {
  classifyTeamBracketHalves,
  resolvePickWindow,
  validateSubChampionHalf,
  type AdjustSubChampionInput,
  type AdjustSubChampionResponse,
  type ChampionPickStatus,
  type PickWindowResolution,
  type SaveSubChampionPickInput,
  type SaveSubChampionPickResponse,
  type SubChampionPickResponse,
  type SubChampionValidationReason
} from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import type { StoredMatch } from "../../matches/types";
import { tuMundialService } from "../../tournament/services/tu-mundial-service";
import { championPicksRepository } from "../repositories/macro-picks-repository";
import { subChampionPicksRepository } from "../repositories/sub-champion-picks-repository";
import type { StoredSubChampionPick } from "../types";

// ── Schedule helpers ────────────────────────────────────
//
// Mirrors the shape of getChampionSchedule in macro-picks-service.ts. Both
// services derive their schedule from the same resolver (`resolvePickWindow`)
// but keep their own thin wrapper so the domain-level response fields
// (initialDeadlineAt, adjustmentWindowClosesAt, etc.) don't leak upward.

type SubChampionSchedule = {
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

function getSubChampionSchedule(matches: StoredMatch[], now: Date): SubChampionSchedule {
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

// ── Status derivation (identical taxonomy to champion) ──

function deriveStatus(
  stored: StoredSubChampionPick | null,
  schedule: SubChampionSchedule
): ChampionPickStatus {
  if (stored?.isAdjusted) return "adjusted";
  if (schedule.adjustmentWindowOpen && stored?.isLocked && stored.subChampionTeamId && !stored.isAdjusted) {
    return "adjustment_available";
  }
  if (schedule.initialLocked && stored?.subChampionTeamId) return "locked";
  if (stored?.subChampionTeamId) return "picked";
  return "empty";
}

function toResponse(
  stored: StoredSubChampionPick | null,
  schedule: SubChampionSchedule
): SubChampionPickResponse {
  const status = deriveStatus(stored, schedule);
  return {
    status,
    subChampionTeamId: stored?.subChampionTeamId ?? null,
    adjustedSubChampionTeamId: stored?.adjustedSubChampionTeamId ?? null,
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

// ── Validation error mapping ────────────────────────────
//
// The pure validator returns a generic reason; translate each to a distinct
// API error code so the frontend can show a specific message.

const REASON_TO_ERROR: Record<SubChampionValidationReason, { code: "SUB_CHAMPION_SAME_TEAM" | "SUB_CHAMPION_SAME_HALF" | "SUB_CHAMPION_UNRESOLVED_HALF"; message: string }> = {
  SAME_TEAM: {
    code: "SUB_CHAMPION_SAME_TEAM",
    message: "Sub-campeon no puede ser el mismo equipo que el campeon."
  },
  SAME_HALF: {
    code: "SUB_CHAMPION_SAME_HALF",
    message: "Sub-campeon debe estar en la mitad opuesta del bracket al campeon."
  },
  UNRESOLVED_HALF: {
    code: "SUB_CHAMPION_UNRESOLVED_HALF",
    message: "El bracket proyectado no alcanza para ubicar este equipo en un lado. Completa tus predicciones de grupos primero."
  }
};

async function assertCrossHalfOrThrow(
  userId: string,
  championTeamId: string,
  candidateTeamId: string,
  now: Date
): Promise<void> {
  const projection = await tuMundialService.getTournamentProjectionForUser(userId, now);
  const teamHalves = classifyTeamBracketHalves(projection.bracket);
  const result = validateSubChampionHalf(championTeamId, candidateTeamId, teamHalves);
  if (result.valid) return;

  const mapped = REASON_TO_ERROR[result.reason];
  throw new ApiError(409, mapped.code, mapped.message, { reason: result.reason });
}

// ── Service ─────────────────────────────────────────────

export class SubChampionPickService {
  async getForUser(userId: string, now = new Date()): Promise<SubChampionPickResponse> {
    const [stored, matches] = await Promise.all([
      subChampionPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);

    const schedule = getSubChampionSchedule(matches, now);
    return toResponse(stored, schedule);
  }

  async saveForUser(
    userId: string,
    input: SaveSubChampionPickInput,
    now = new Date()
  ): Promise<SaveSubChampionPickResponse> {
    const [champion, matches] = await Promise.all([
      championPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);

    const schedule = getSubChampionSchedule(matches, now);

    if (schedule.initialLocked) {
      throw new ApiError(409, "SUB_CHAMPION_PICK_LOCKED", "Sub-champion pick window A is closed.");
    }

    if (!champion?.championTeamId) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_REQUIRES_CHAMPION",
        "Debes elegir un campeon antes de elegir un sub-campeon."
      );
    }

    const nextTeamId = input.subChampionTeamId.trim();
    await assertCrossHalfOrThrow(userId, champion.championTeamId, nextTeamId, now);

    const existing = await subChampionPicksRepository.getByUserId(userId);
    const nowIso = now.toISOString();

    const nextPick: StoredSubChampionPick = {
      userId,
      subChampionTeamId: nextTeamId,
      adjustedSubChampionTeamId: existing?.adjustedSubChampionTeamId ?? null,
      isLocked: false,
      isAdjusted: existing?.isAdjusted ?? false,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      lockedAt: existing?.lockedAt ?? null,
      adjustedAt: existing?.adjustedAt ?? null
    };

    await subChampionPicksRepository.upsert(nextPick);

    return { ok: true, status: "picked" };
  }

  async adjustForUser(
    userId: string,
    input: AdjustSubChampionInput,
    now = new Date()
  ): Promise<AdjustSubChampionResponse> {
    const [existing, champion, matches] = await Promise.all([
      subChampionPicksRepository.getByUserId(userId),
      championPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);

    const schedule = getSubChampionSchedule(matches, now);

    if (!existing?.subChampionTeamId) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_PICK_NOT_FOUND",
        "No hay sub-campeon guardado para ajustar."
      );
    }

    if (!schedule.initialLocked) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_ADJUSTMENT_NOT_AVAILABLE",
        "El ajuste se habilita recien cuando cierran los grupos."
      );
    }

    if (!schedule.adjustmentWindowOpen) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_ADJUSTMENT_WINDOW_CLOSED",
        "La ventana de ajuste de sub-campeon esta cerrada."
      );
    }

    if (existing.isAdjusted) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_ADJUSTMENT_ALREADY_USED",
        "Ya usaste tu ajuste de sub-campeon."
      );
    }

    if (!champion?.championTeamId) {
      throw new ApiError(
        409,
        "SUB_CHAMPION_REQUIRES_CHAMPION",
        "Debes tener un campeon para ajustar el sub-campeon."
      );
    }

    const nextTeamId = input.subChampionTeamId.trim();
    await assertCrossHalfOrThrow(userId, champion.championTeamId, nextTeamId, now);

    const nowIso = now.toISOString();

    const nextPick: StoredSubChampionPick = {
      ...existing,
      adjustedSubChampionTeamId: nextTeamId,
      isLocked: true,
      isAdjusted: true,
      adjustedAt: nowIso,
      updatedAt: nowIso,
      lockedAt: existing.lockedAt ?? schedule.initialDeadlineAt
    };

    await subChampionPicksRepository.upsert(nextPick);

    return {
      ok: true,
      status: "adjusted",
      penaltyNotice: "Si aciertas el sub-campeon ajustado, sumas 10 pts en vez de 25."
    };
  }
}

export const subChampionPickService = new SubChampionPickService();
