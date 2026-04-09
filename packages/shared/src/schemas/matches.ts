import { z } from "zod";
import { MATCH_LIST_FILTERS, MATCH_SCORING_RULES, MATCH_STAGES, MATCH_STATUSES, PREDICTION_STATUSES } from "../constants/matches";

const isoTimestampSchema = z.string().min(1);

export const teamRefSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1),
  flagUrl: z.string().min(1).nullable()
});

export const matchStageSchema = z.enum(MATCH_STAGES);

export const matchStatusSchema = z.enum(MATCH_STATUSES);

export const predictionStatusSchema = z.enum(PREDICTION_STATUSES);

export const matchListFilterSchema = z.enum(MATCH_LIST_FILTERS);

export const matchSummarySchema = z.object({
  matchId: z.string().min(1),
  stage: matchStageSchema,
  groupId: z.string().min(1).nullable(),
  homeTeam: teamRefSchema,
  awayTeam: teamRefSchema,
  kickoffAt: isoTimestampSchema,
  status: matchStatusSchema,
  deadlineAt: isoTimestampSchema,
  isLocked: z.boolean(),
  isFinished: z.boolean(),
  isScored: z.boolean(),
  predictionStatus: predictionStatusSchema,
  userPredictionSummary: z.string().min(1).nullable(),
  isEditable: z.boolean(),
  ctaLabel: z.string().min(1)
});

export const matchOfficialResultSchema = z.object({
  homeScore90: z.number().int().nonnegative(),
  awayScore90: z.number().int().nonnegative(),
  qualifiedTeamId: z.string().min(1).nullable(),
  status: matchStatusSchema
});

export const matchPredictionScoringBreakdownSchema = z.object({
  exact90Hit: z.boolean(),
  correctOutcome90Hit: z.boolean(),
  correctQualifierHit: z.boolean(),
  pointsExact90: z.number().int().nonnegative(),
  pointsOutcome90: z.number().int().nonnegative(),
  pointsQualifier: z.number().int().nonnegative(),
  pointsTotal: z.number().int().nonnegative()
});

export const userMatchPredictionSchema = z.object({
  predictionId: z.string().min(1),
  homeScorePred: z.number().int().nonnegative(),
  awayScorePred: z.number().int().nonnegative(),
  predictedQualifierTeamId: z.string().min(1).nullable(),
  status: predictionStatusSchema,
  pointsAwarded: z.number().int().nonnegative().nullable(),
  submittedAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  scoringBreakdown: matchPredictionScoringBreakdownSchema.optional()
});

export const matchScoringRulesSchema = z.object({
  exact90Points: z.literal(MATCH_SCORING_RULES.exact90Points),
  correctOutcome90Points: z.literal(MATCH_SCORING_RULES.correctOutcome90Points),
  correctQualifierPoints: z.literal(MATCH_SCORING_RULES.correctQualifierPoints)
});

export const matchDetailSchema = matchSummarySchema.extend({
  requiresQualifierIfDraw: z.boolean(),
  officialResult: matchOfficialResultSchema.nullable(),
  userPrediction: userMatchPredictionSchema.nullable(),
  scoringRules: matchScoringRulesSchema
});

export const listMatchesQuerySchema = z.object({
  stage: matchStageSchema.optional(),
  filter: matchListFilterSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().positive().max(100).optional()
});

export const listMatchesResponseSchema = z.object({
  items: z.array(matchSummarySchema),
  nextCursor: z.string().min(1).nullable()
});

export const saveMatchPredictionInputSchema = z
  .object({
    homeScorePred: z.number().int().nonnegative(),
    awayScorePred: z.number().int().nonnegative(),
    predictedQualifierTeamId: z.string().min(1).nullable().optional()
  });

export const saveKnockoutMatchPredictionInputSchema = saveMatchPredictionInputSchema.superRefine((value, context) => {
  if (value.homeScorePred === value.awayScorePred && !value.predictedQualifierTeamId) {
    context.addIssue({
      code: "custom",
      message: "predictedQualifierTeamId is required when a knockout prediction ends in a draw."
    });
  }
});

export const saveMatchPredictionResponseSchema = z.object({
  predictionId: z.string().min(1),
  matchId: z.string().min(1),
  status: predictionStatusSchema,
  isEditable: z.boolean(),
  homeScorePred: z.number().int().nonnegative(),
  awayScorePred: z.number().int().nonnegative(),
  predictedQualifierTeamId: z.string().min(1).nullable(),
  savedAt: isoTimestampSchema
});

export type ListMatchesQueryInput = z.infer<typeof listMatchesQuerySchema>;
