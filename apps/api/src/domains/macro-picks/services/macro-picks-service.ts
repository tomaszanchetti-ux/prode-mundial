import {
  resolvePickWindow,
  type ChampionPickResponse,
  type ChampionPickStatus,
  type PickWindowResolution,
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
//
// The timestamps here describe match kickoffs ("when does X play"). Whether
// a pick window is open is NOT driven by these directly — that's the job of
// `resolvePickWindow` (shared), which applies the 1h pre-kickoff offset and
// the groups-closed event gate.

type ChampionSchedule = {
  /** Window A closes at inaugural − 1h. */
  initialDeadlineAt: string | null;
  /** Displayed as "B opens around this time" — actually driven by the groups-closed event. */
  adjustmentWindowOpensAt: string | null;
  /** Window B closes at R16 − 1h. */
  adjustmentWindowClosesAt: string | null;
  initialLocked: boolean;
  adjustmentWindowOpen: boolean;
  /** EPIC 17 — full pick-window resolution passed through to the API response. */
  pickWindow: PickWindowResolution;
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

  // initialDeadlineAt and adjustmentWindowClosesAt always represent the real
  // lock times (inaugural − 1h and first-knock-out − 1h), independent of
  // which window is currently open.
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
      : null,
    pickWindow: schedule.pickWindow.window,
    pickWindowClosesAt: schedule.pickWindow.closesAt,
    pickWindowPointValue: schedule.pickWindow.pointValue
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
