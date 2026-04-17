import { z } from "zod";
import { matchStageSchema, teamRefSchema } from "./matches";

export const tournamentModeSchema = z.enum(["pre_tournament", "live_tournament"]);

export const preTournamentSummarySchema = z.object({
  isPreTournament: z.boolean(),
  completedMatches: z.number().int().nonnegative(),
  totalMatches: z.number().int().nonnegative(),
  remainingMatches: z.number().int().nonnegative(),
  completionPercentage: z.number().int().min(0).max(100),
  nextPendingMatchId: z.string().min(1).nullable()
});

export const predictedGroupStandingRowSchema = z.object({
  teamId: z.string().min(1),
  teamName: z.string().min(1),
  fifaCode: z.string().min(1).nullable(),
  iso2: z.string().min(1).nullable(),
  iso3: z.string().min(1).nullable(),
  flagAsset: z.string().min(1).nullable(),
  flagUrl: z.string().min(1).nullable(),
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  drawn: z.number().int().nonnegative(),
  lost: z.number().int().nonnegative(),
  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),
  goalDifference: z.number().int(),
  points: z.number().int().nonnegative(),
  position: z.number().int().positive(),
  isProjectedQualified: z.boolean()
});

export const tuMundialGroupCardSchema = z.object({
  groupId: z.string().min(1),
  groupName: z.string().min(1),
  completedMatches: z.number().int().nonnegative(),
  totalMatches: z.number().int().nonnegative(),
  isComplete: z.boolean(),
  items: z.array(predictedGroupStandingRowSchema)
});

export const tuMundialResponseSchema = z.object({
  mode: tournamentModeSchema,
  groups: z.array(tuMundialGroupCardSchema),
  updatedAt: z.string().min(1)
});

export const tournamentProjectionSideSchema = z.object({
  team: teamRefSchema.nullable(),
  slot: z.string().min(1),
  slotLabel: z.string().min(1)
});

export const tournamentProjectionMatchSchema = z.object({
  matchId: z.string().min(1),
  stage: matchStageSchema,
  kickoffAt: z.string().min(1),
  kickoffAtEt: z.string().min(1).nullable(),
  venueId: z.string().min(1).nullable(),
  home: tournamentProjectionSideSchema,
  away: tournamentProjectionSideSchema
});

export const tournamentProjectionReadinessSchema = z.object({
  groupMatchesTotal: z.number().int().nonnegative(),
  groupMatchesWithPrediction: z.number().int().nonnegative(),
  isGroupsComplete: z.boolean(),
  unresolvedSlots: z.array(z.string().min(1))
});

export const tournamentProjectionResponseSchema = z.object({
  mode: tournamentModeSchema,
  groups: z.array(tuMundialGroupCardSchema),
  bracket: z.object({
    round32: z.array(tournamentProjectionMatchSchema)
  }),
  readiness: tournamentProjectionReadinessSchema,
  updatedAt: z.string().min(1)
});
