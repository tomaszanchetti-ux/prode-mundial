import {
  type ChampionPickResponse,
  type ChampionPickStatus,
  type SaveChampionPickInput,
  type SaveChampionPickResponse,
  type AdjustChampionInput,
  type AdjustChampionResponse
} from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import type { StoredMatch } from "../../matches/types";
import { championPicksRepository } from "../repositories/macro-picks-repository";
import { championScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import type { StoredChampionPick } from "../types";

// ── Schedule helpers ────────────────────────────────────

type ChampionSchedule = {
  initialDeadlineAt: string | null;
  adjustmentWindowOpensAt: string | null;
  adjustmentWindowClosesAt: string | null;
  initialLocked: boolean;
  adjustmentWindowOpen: boolean;
};

function compareKickoff(left: StoredMatch, right: StoredMatch) {
  const byKickoff = left.kickoffAt.localeCompare(right.kickoffAt);

  if (byKickoff !== 0) {
    return byKickoff;
  }

  return left.matchId.localeCompare(right.matchId);
}

function getChampionSchedule(matches: StoredMatch[], now: Date): ChampionSchedule {
  const sortedMatches = [...matches].sort(compareKickoff);
  const firstMatch = sortedMatches[0];

  if (!firstMatch) {
    return {
      initialDeadlineAt: null,
      adjustmentWindowOpensAt: null,
      adjustmentWindowClosesAt: null,
      initialLocked: false,
      adjustmentWindowOpen: false
    };
  }

  const groupMatches = sortedMatches.filter((match) => match.stage === "group");
  const knockoutMatches = sortedMatches.filter((match) => match.stage !== "group");
  const lastGroupMatch = [...groupMatches].sort(compareKickoff).at(-1) ?? null;
  const firstKnockoutMatch = knockoutMatches[0] ?? null;
  const groupStageCompleted =
    groupMatches.length > 0 && groupMatches.every((match) => match.status === "finished" || match.status === "corrected");

  const initialDeadlineAt = firstMatch.kickoffAt;
  const adjustmentWindowOpensAt = lastGroupMatch?.kickoffAt ?? null;
  const adjustmentWindowClosesAt = firstKnockoutMatch?.kickoffAt ?? null;
  const initialLocked = now.getTime() >= new Date(initialDeadlineAt).getTime();
  const adjustmentWindowOpen = Boolean(
    groupStageCompleted &&
      adjustmentWindowClosesAt &&
      now.getTime() < new Date(adjustmentWindowClosesAt).getTime()
  );

  return {
    initialDeadlineAt,
    adjustmentWindowOpensAt,
    adjustmentWindowClosesAt,
    initialLocked,
    adjustmentWindowOpen
  };
}

// ── Status derivation ───────────────────────────────────

function deriveStatus(
  stored: StoredChampionPick | null,
  schedule: ChampionSchedule,
  hasScoringLog: boolean
): ChampionPickStatus {
  if (hasScoringLog && stored?.championTeamId) {
    return "scored";
  }

  if (stored?.isAdjusted) {
    return "adjusted";
  }

  if (schedule.adjustmentWindowOpen && stored?.isLocked && stored.championTeamId && !stored.isAdjusted) {
    return "adjustment_available";
  }

  if (schedule.initialLocked && stored?.championTeamId) {
    return "locked";
  }

  if (stored?.championTeamId) {
    return "picked";
  }

  return "empty";
}

// ── Response builder ────────────────────────────────────

function toResponse(
  stored: StoredChampionPick | null,
  schedule: ChampionSchedule,
  hasScoringLog: boolean,
  scoringPoints: number | null,
  scoringWasAdjusted: boolean | null
): ChampionPickResponse {
  const status = deriveStatus(stored, schedule, hasScoringLog);

  return {
    status,
    championTeamId: stored?.championTeamId ?? null,
    adjustedChampionTeamId: stored?.adjustedChampionTeamId ?? null,
    initialDeadlineAt: schedule.initialDeadlineAt,
    adjustmentWindowOpensAt: schedule.adjustmentWindowOpensAt,
    adjustmentWindowClosesAt: schedule.adjustmentWindowClosesAt,
    isLocked: schedule.initialLocked || Boolean(stored?.isAdjusted),
    isAdjustmentWindowOpen: schedule.adjustmentWindowOpen,
    scoringResult: hasScoringLog && scoringPoints !== null
      ? { points: scoringPoints, wasAdjusted: scoringWasAdjusted ?? false }
      : null
  };
}

// ── Service ─────────────────────────────────────────────

export class ChampionPickService {
  async getForUser(userId: string, now = new Date()): Promise<ChampionPickResponse> {
    const [stored, matches, scoringLogs] = await Promise.all([
      championPicksRepository.getByUserId(userId),
      matchesRepository.listMatches(),
      championScoringLogsRepository.listByUserId(userId)
    ]);

    const schedule = getChampionSchedule(matches, now);
    const latestLog = scoringLogs.length > 0 ? scoringLogs[0] : null;

    return toResponse(
      stored,
      schedule,
      scoringLogs.length > 0,
      latestLog?.championPoints ?? null,
      latestLog?.wasAdjusted ?? null
    );
  }

  async saveForUser(userId: string, input: SaveChampionPickInput, now = new Date()): Promise<SaveChampionPickResponse> {
    const matches = await matchesRepository.listMatches();
    const schedule = getChampionSchedule(matches, now);

    if (schedule.initialLocked) {
      throw new ApiError(409, "CHAMPION_PICK_LOCKED", "Champion pick is already locked.");
    }

    const existing = await championPicksRepository.getByUserId(userId);
    const nowIso = now.toISOString();

    const nextPick: StoredChampionPick = {
      userId,
      championTeamId: input.championTeamId.trim(),
      adjustedChampionTeamId: existing?.adjustedChampionTeamId ?? null,
      isLocked: false,
      isAdjusted: existing?.isAdjusted ?? false,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      lockedAt: existing?.lockedAt ?? null,
      adjustedAt: existing?.adjustedAt ?? null
    };

    await championPicksRepository.upsert(nextPick);

    return { ok: true, status: "picked" };
  }

  async adjustForUser(userId: string, input: AdjustChampionInput, now = new Date()): Promise<AdjustChampionResponse> {
    const [existing, matches] = await Promise.all([
      championPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);
    const schedule = getChampionSchedule(matches, now);

    if (!existing?.championTeamId || !schedule.initialLocked) {
      throw new ApiError(409, "ADJUSTMENT_NOT_AVAILABLE", "Champion adjustment is not available.");
    }

    if (!schedule.adjustmentWindowOpen) {
      throw new ApiError(409, "ADJUSTMENT_WINDOW_CLOSED", "The adjustment window is not open.");
    }

    if (existing.isAdjusted) {
      throw new ApiError(409, "ADJUSTMENT_ALREADY_USED", "Champion adjustment was already used.");
    }

    const nowIso = now.toISOString();

    const nextPick: StoredChampionPick = {
      ...existing,
      adjustedChampionTeamId: input.championTeamId.trim(),
      isLocked: true,
      isAdjusted: true,
      adjustedAt: nowIso,
      updatedAt: nowIso,
      lockedAt: existing.lockedAt ?? schedule.initialDeadlineAt
    };

    await championPicksRepository.upsert(nextPick);

    return {
      ok: true,
      status: "adjusted",
      penaltyNotice: "Si aciertas el campeon ajustado, sumas 10 pts en vez de 25."
    };
  }
}

export const championPickService = new ChampionPickService();
