import type { MatchStage, PointsResponse } from "@prode/shared";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import { teamsRepository } from "../../matches/repositories/teams-repository";
import { usersRepository } from "../../users/repositories/users-repository";

function toStageLabel(stage: MatchStage, groupId: string | null) {
  if (stage === "group" && groupId) {
    return `Grupo ${groupId}`;
  }

  const labels: Record<Exclude<MatchStage, "group">, string> = {
    R32: "Octavos",
    R16: "R16",
    QF: "Cuartos",
    SF: "Semifinal",
    BRONZE: "Tercer puesto",
    FINAL: "Final"
  };

  return labels[stage as Exclude<MatchStage, "group">] ?? stage;
}

export async function getPoints(userId: string): Promise<PointsResponse> {
  const [profile, predictions, matches] = await Promise.all([
    usersRepository.findByUserId(userId),
    predictionsRepository.listPredictionsByUser(userId),
    matchesRepository.listMatches()
  ]);

  if (!profile) {
    return {
      totalPoints: 0,
      macroPoints: 0,
      exactHits: 0,
      correctSigns: 0,
      recentMatches: []
    };
  }

  const matchMap = new Map(matches.map((match) => [match.matchId, match]));
  const teamMap = await teamsRepository.getTeamsByIds(
    matches.flatMap((match) => [match.homeTeamId ?? "", match.awayTeamId ?? ""])
  );
  const scoredPredictions = predictions.filter(
    (prediction): prediction is typeof prediction & {
      scoringBreakdown: NonNullable<typeof prediction.scoringBreakdown>;
      scoredAt: string;
    } => Boolean(prediction.isScored && prediction.scoringBreakdown && prediction.scoredAt)
  );
  const recentMatches = scoredPredictions
    .sort((left, right) => (right.scoredAt ?? "").localeCompare(left.scoredAt ?? ""))
    .slice(0, 5)
    .map((prediction) => {
      const scoringBreakdown = prediction.scoringBreakdown;
      const match = matchMap.get(prediction.matchId);
      const homeTeamLabel = match?.homeTeamId ? (teamMap.get(match.homeTeamId)?.name ?? match.homeTeamId) : "Local";
      const awayTeamLabel = match?.awayTeamId ? (teamMap.get(match.awayTeamId)?.name ?? match.awayTeamId) : "Visitante";

      return {
        matchId: prediction.matchId,
        matchLabel: `${homeTeamLabel} vs ${awayTeamLabel}`,
        stageLabel: toStageLabel(match?.stage ?? "group", match?.groupId ?? null),
        points: prediction.pointsAwarded,
        scoredAt: prediction.scoredAt ?? prediction.updatedAt,
        breakdown: {
          exact90Hit: scoringBreakdown.exact90Points > 0,
          correctOutcome90Hit: scoringBreakdown.outcome90Points > 0,
          correctQualifierHit: scoringBreakdown.qualifierPoints > 0,
          pointsExact90: scoringBreakdown.exact90Points,
          pointsOutcome90: scoringBreakdown.outcome90Points,
          pointsQualifier: scoringBreakdown.qualifierPoints,
          pointsTotal: scoringBreakdown.totalPoints
        }
      };
    });

  return {
    totalPoints: profile.totalPoints,
    macroPoints: profile.macroPoints,
    exactHits: profile.exactHits,
    correctSigns: profile.correctSigns,
    recentMatches
  };
}
