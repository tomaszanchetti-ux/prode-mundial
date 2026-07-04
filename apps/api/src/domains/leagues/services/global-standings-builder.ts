import type { LeagueStandingEntry, UserPointsSummary } from "@prode/shared";

type GlobalStandingProfile = { userId: string; displayName: string } & Partial<UserPointsSummary>;

function buildPointsSummary(input?: Partial<UserPointsSummary>): UserPointsSummary {
  return {
    totalPoints: input?.totalPoints ?? 0,
    macroPoints: input?.macroPoints ?? 0,
    exactHits: input?.exactHits ?? 0,
    correctSigns: input?.correctSigns ?? 0
  };
}

function compareProfiles(left: GlobalStandingProfile, right: GlobalStandingProfile) {
  const leftSummary = buildPointsSummary(left);
  const rightSummary = buildPointsSummary(right);

  if (leftSummary.totalPoints !== rightSummary.totalPoints) {
    return rightSummary.totalPoints - leftSummary.totalPoints;
  }

  if (leftSummary.exactHits !== rightSummary.exactHits) {
    return rightSummary.exactHits - leftSummary.exactHits;
  }

  if (leftSummary.correctSigns !== rightSummary.correctSigns) {
    return rightSummary.correctSigns - leftSummary.correctSigns;
  }

  if (leftSummary.macroPoints !== rightSummary.macroPoints) {
    return rightSummary.macroPoints - leftSummary.macroPoints;
  }

  return left.displayName.localeCompare(right.displayName);
}

export function buildGlobalStandingRows(
  profiles: GlobalStandingProfile[],
  requestingUserId: string
): LeagueStandingEntry[] {
  return [...profiles]
    .sort(compareProfiles)
    .map((profile, index) => {
      const summary = buildPointsSummary(profile);

      return {
        position: index + 1,
        userId: profile.userId,
        displayName: profile.displayName,
        totalPoints: summary.totalPoints,
        macroPoints: summary.macroPoints,
        exactHits: summary.exactHits,
        correctSigns: summary.correctSigns,
        isMe: profile.userId === requestingUserId,
        isOwner: false
      };
    });
}
