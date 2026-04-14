import {
  MACRO_GROUP_IDS,
  MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL,
  type ConfirmMacroAdjustmentInput,
  type ConfirmMacroAdjustmentResponse,
  type MacroGroupPick,
  type MacroGroupPicks,
  type MacroPicksCompletion,
  type MacroPicksResponse,
  type SaveMacroPicksInput,
  type SaveMacroPicksResponse
} from "@prode/shared";
import { ApiError } from "../../../server/errors/api-error";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import type { StoredMatch } from "../../matches/types";
import { macroPicksRepository } from "../repositories/macro-picks-repository";
import { macroScoringLogsRepository } from "../repositories/macro-scoring-logs-repository";
import type { StoredMacroPrediction } from "../types";

type MacroSchedule = {
  initialDeadlineAt: string;
  adjustmentWindow: {
    opensAt: string | null;
    closesAt: string | null;
  };
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

function getMacroSchedule(matches: StoredMatch[], now: Date): MacroSchedule {
  const sortedMatches = [...matches].sort(compareKickoff);
  const firstMatch = sortedMatches[0];

  if (!firstMatch) {
    throw new Error("Cannot resolve macro picks schedule without tournament matches.");
  }

  const groupMatches = sortedMatches.filter((match) => match.stage === "group");
  const knockoutMatches = sortedMatches.filter((match) => match.stage !== "group");
  const lastGroupMatch = [...groupMatches].sort(compareKickoff).at(-1) ?? null;
  const firstKnockoutMatch = knockoutMatches[0] ?? null;
  const groupStageCompleted =
    groupMatches.length > 0 && groupMatches.every((match) => match.status === "finished" || match.status === "corrected");
  const initialDeadlineAt = firstMatch.kickoffAt;
  const adjustmentOpensAt = lastGroupMatch?.kickoffAt ?? null;
  const adjustmentClosesAt = firstKnockoutMatch?.kickoffAt ?? null;
  const initialLocked = now.getTime() >= new Date(initialDeadlineAt).getTime();
  const adjustmentWindowOpen = Boolean(
    groupStageCompleted &&
      adjustmentClosesAt &&
      now.getTime() < new Date(adjustmentClosesAt).getTime()
  );

  return {
    initialDeadlineAt,
    adjustmentWindow: {
      opensAt: adjustmentOpensAt,
      closesAt: adjustmentClosesAt
    },
    initialLocked,
    adjustmentWindowOpen
  };
}

function isNonEmptyTeamId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCompletedGroupPick(groupPick: MacroGroupPick | undefined): groupPick is MacroGroupPick {
  return Boolean(
    groupPick &&
      isNonEmptyTeamId(groupPick.firstTeamId) &&
      isNonEmptyTeamId(groupPick.secondTeamId) &&
      groupPick.firstTeamId !== groupPick.secondTeamId
  );
}

function hasUniqueFinalists(finalists: string[]) {
  return finalists.length === 2 && new Set(finalists).size === finalists.length;
}

function hasValidChampion(finalists: string[], champion: string | null) {
  return isNonEmptyTeamId(champion) && finalists.includes(champion);
}

function deriveCompletion(groupPicks: MacroGroupPicks, finalists: string[], champion: string | null): MacroPicksCompletion {
  const groupsCompleted = MACRO_GROUP_IDS.filter((groupId) => isCompletedGroupPick(groupPicks[groupId])).length;
  const hasFinalists = hasUniqueFinalists(finalists);
  const hasChampion = hasValidChampion(finalists, champion);
  const completedUnits = groupsCompleted + (hasFinalists ? 1 : 0) + (hasChampion ? 1 : 0);
  const totalUnits = MACRO_GROUP_IDS.length + 2;

  return {
    groupsCompleted,
    groupsTotal: MACRO_GROUP_IDS.length,
    hasFinalists,
    hasChampion,
    percent: Math.round((completedUnits / totalUnits) * 100)
  };
}

function normalizeGroupPicks(groupPicks: MacroGroupPicks): MacroGroupPicks {
  const normalizedEntries = Object.entries(groupPicks).flatMap(([groupId, groupPick]) => {
    if (!groupPick || !isNonEmptyTeamId(groupPick.firstTeamId) || !isNonEmptyTeamId(groupPick.secondTeamId)) {
      return [];
    }

    return [
      [
        groupId,
        {
          firstTeamId: groupPick.firstTeamId.trim(),
          secondTeamId: groupPick.secondTeamId.trim()
        }
      ] as const
    ];
  });

  return Object.fromEntries(normalizedEntries) as MacroGroupPicks;
}

function normalizeFinalists(finalists: string[]) {
  return finalists.map((teamId) => teamId.trim()).filter((teamId) => teamId.length > 0);
}

function assertGroupPicksAreValid(groupPicks: MacroGroupPicks) {
  for (const groupId of MACRO_GROUP_IDS) {
    const groupPick = groupPicks[groupId];

    if (!groupPick) {
      continue;
    }

    if (groupPick.firstTeamId.trim() === groupPick.secondTeamId.trim()) {
      throw new ApiError(400, "INVALID_GROUP_PICK_DUPLICATE", "Group picks cannot repeat the same team.", {
        groupId
      });
    }
  }
}

function assertFinalistsAreValid(finalists: string[]) {
  if (finalists.length === 0) {
    return;
  }

  if (finalists.length !== 2 || new Set(finalists).size !== finalists.length) {
    throw new ApiError(400, "INVALID_FINALISTS_DUPLICATE", "Finalists must contain two different teams.");
  }
}

function assertChampionIsValid(finalists: string[], champion: string | null) {
  if (!champion) {
    return;
  }

  if (!finalists.includes(champion)) {
    throw new ApiError(400, "INVALID_CHAMPION_NOT_IN_FINALISTS", "Champion must belong to finalists.");
  }
}

function toResponse(stored: StoredMacroPrediction | null, schedule: MacroSchedule, hasScoringLog: boolean): MacroPicksResponse {
  const groupPicks = stored?.groupPicks ?? {};
  const finalists = stored?.finalists ?? [];
  const champion = stored?.champion ?? null;
  const completion = deriveCompletion(groupPicks, finalists, champion);
  const adjustmentAlreadyUsed = Boolean(stored?.isAdjusted);
  const adjustmentAvailable = Boolean(schedule.adjustmentWindowOpen && stored?.isSubmitted && !adjustmentAlreadyUsed);

  let status: MacroPicksResponse["status"];

  if (hasScoringLog && stored?.isSubmitted) {
    status = "fully_scored";
  } else if (adjustmentAlreadyUsed) {
    status = "adjusted_locked";
  } else if (adjustmentAvailable) {
    status = "adjustment_available";
  } else if (schedule.initialLocked) {
    status = "locked_original";
  } else if (!stored || completion.percent === 0) {
    status = "not_started";
  } else if (stored.isSubmitted) {
    status = "submitted_editable";
  } else {
    status = "draft_editable";
  }

  return {
    status,
    isLocked: schedule.initialLocked || adjustmentAlreadyUsed,
    adjustmentAvailable,
    adjustmentAlreadyUsed,
    initialDeadlineAt: schedule.initialDeadlineAt,
    adjustmentWindow: schedule.adjustmentWindow,
    groupPicks,
    finalists,
    champion,
    adjustedFinalists: stored?.adjustedFinalists ?? undefined,
    adjustedChampion: stored?.adjustedChampion ?? undefined,
    adjustmentConfirmedAt: stored?.adjustedAt ?? undefined,
    completion
  };
}

export class MacroPicksService {
  async getForUser(userId: string, now = new Date()): Promise<MacroPicksResponse> {
    const [stored, matches, scoringLogs] = await Promise.all([
      macroPicksRepository.getByUserId(userId),
      matchesRepository.listMatches(),
      macroScoringLogsRepository.listByUserId(userId)
    ]);

    return toResponse(stored, getMacroSchedule(matches, now), scoringLogs.length > 0);
  }

  async saveForUser(userId: string, input: SaveMacroPicksInput, now = new Date()): Promise<SaveMacroPicksResponse> {
    const matches = await matchesRepository.listMatches();
    const schedule = getMacroSchedule(matches, now);

    if (schedule.initialLocked) {
      throw new ApiError(409, "MACRO_PICKS_LOCKED", "Macro picks are already locked.");
    }

    const groupPicks = normalizeGroupPicks(input.groupPicks);
    const finalists = normalizeFinalists(input.finalists);
    const champion = input.champion?.trim() ?? null;

    assertGroupPicksAreValid(groupPicks);
    assertFinalistsAreValid(finalists);
    assertChampionIsValid(finalists, champion);

    const completion = deriveCompletion(groupPicks, finalists, champion);
    const existing = await macroPicksRepository.getByUserId(userId);
    const nowIso = now.toISOString();
    const nextPrediction: StoredMacroPrediction = {
      userId,
      groupPicks,
      finalists: finalists.length > 0 ? finalists : null,
      champion,
      isLocked: false,
      isSubmitted: completion.groupsCompleted === MACRO_GROUP_IDS.length && completion.hasFinalists && completion.hasChampion,
      isAdjusted: existing?.isAdjusted ?? false,
      adjustedAt: existing?.adjustedAt ?? null,
      adjustedFinalists: existing?.adjustedFinalists ?? null,
      adjustedChampion: existing?.adjustedChampion ?? null,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      lockedAt: existing?.lockedAt ?? null
    };

    await macroPicksRepository.upsert(nextPrediction);

    return {
      status: nextPrediction.isSubmitted ? "submitted_editable" : "draft_editable",
      savedAt: nowIso,
      completionPercent: completion.percent
    };
  }

  async confirmAdjustmentForUser(
    userId: string,
    input: ConfirmMacroAdjustmentInput,
    now = new Date()
  ): Promise<ConfirmMacroAdjustmentResponse> {
    const [existing, matches] = await Promise.all([
      macroPicksRepository.getByUserId(userId),
      matchesRepository.listMatches()
    ]);
    const schedule = getMacroSchedule(matches, now);

    if (!existing?.isSubmitted || !schedule.initialLocked || !schedule.adjustmentWindowOpen) {
      throw new ApiError(409, "ADJUSTMENT_NOT_AVAILABLE", "Macro adjustment is not available.");
    }

    if (existing.isAdjusted) {
      throw new ApiError(409, "ADJUSTMENT_ALREADY_USED", "Macro adjustment was already used.");
    }

    const finalists = normalizeFinalists(input.finalists);
    const champion = input.champion.trim();

    assertFinalistsAreValid(finalists);
    assertChampionIsValid(finalists, champion);

    const nowIso = now.toISOString();
    const nextPrediction: StoredMacroPrediction = {
      ...existing,
      isLocked: true,
      isAdjusted: true,
      adjustedAt: nowIso,
      adjustedFinalists: finalists,
      adjustedChampion: champion,
      updatedAt: nowIso,
      lockedAt: existing.lockedAt ?? schedule.initialDeadlineAt
    };

    await macroPicksRepository.upsert(nextPrediction);

    return {
      status: "adjusted_locked",
      adjustmentConfirmedAt: nowIso,
      adjustedFinalists: finalists,
      adjustedChampion: champion,
      penaltyModel: MACRO_PICKS_ADJUSTMENT_PENALTY_MODEL
    };
  }
}

export const macroPicksService = new MacroPicksService();
