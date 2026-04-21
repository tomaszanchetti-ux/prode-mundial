import { z } from "zod";

export const leagueMembershipRoleSchema = z.enum(["owner", "member"]);

export const leagueSummarySchema = z.object({
  leagueId: z.string().min(1),
  name: z.string().min(1),
  memberLimit: z.number().int().positive(),
  membersCount: z.number().int().nonnegative(),
  position: z.number().int().positive().nullable(),
  userPoints: z.number().int().nonnegative(),
  isActive: z.boolean(),
  inviteCode: z.string().min(1),
  inviteLink: z.string().url().nullable()
});

export const listMyLeaguesResponseSchema = z.object({
  items: z.array(leagueSummarySchema)
});

export const createLeagueInputSchema = z.object({
  name: z.string().trim().min(3).max(40)
});

export const joinLeagueInputSchema = z.object({
  inviteCode: z.string().trim().min(4).max(24).optional(),
  inviteToken: z.string().trim().min(8).max(128).optional()
})
  .refine((value) => Boolean(value.inviteCode || value.inviteToken), {
    message: "Either inviteCode or inviteToken is required.",
    path: ["inviteCode"]
  });

export const leagueStandingEntrySchema = z.object({
  position: z.number().int().positive(),
  userId: z.string().min(1),
  displayName: z.string().min(1),
  totalPoints: z.number().int().nonnegative(),
  exactHits: z.number().int().nonnegative(),
  correctSigns: z.number().int().nonnegative(),
  macroPoints: z.number().int().nonnegative(),
  isMe: z.boolean(),
  isOwner: z.boolean()
});

export const leagueStandingSummarySchema = z.object({
  position: z.number().int().positive(),
  totalPoints: z.number().int().nonnegative(),
  exactHits: z.number().int().nonnegative(),
  correctSigns: z.number().int().nonnegative(),
  macroPoints: z.number().int().nonnegative()
});

export const leagueStandingMiniSchema = leagueStandingSummarySchema;

export const leagueStandingsLeagueSchema = z.object({
  leagueId: z.string().min(1),
  name: z.string().min(1),
  memberLimit: z.number().int().positive(),
  membersCount: z.number().int().nonnegative()
});

export const leagueDetailSchema = z.object({
  leagueId: z.string().min(1),
  name: z.string().min(1),
  memberLimit: z.number().int().positive(),
  membersCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  inviteCode: z.string().min(1),
  inviteLink: z.string().url().nullable(),
  membershipRole: leagueMembershipRoleSchema,
  myStanding: leagueStandingMiniSchema.nullable()
});

export const leagueInvitePreviewSchema = z.object({
  leagueId: z.string().min(1),
  name: z.string().min(1),
  memberLimit: z.number().int().positive(),
  membersCount: z.number().int().nonnegative(),
  isActive: z.boolean()
});

export const leagueStandingsResponseSchema = z.object({
  league: leagueStandingsLeagueSchema,
  items: z.array(leagueStandingEntrySchema),
  myStanding: leagueStandingSummarySchema.nullable()
});
