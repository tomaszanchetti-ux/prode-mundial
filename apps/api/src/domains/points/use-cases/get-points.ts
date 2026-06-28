import type { MatchStage, PointsByStage, PointsResponse } from "@prode/shared";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import { teamsRepository } from "../../matches/repositories/teams-repository";
import type { StoredMatchStatus } from "../../matches/types";
import { usersRepository } from "../../users/repositories/users-repository";
import { championScoringLogsRepository } from "../../macro-picks/repositories/macro-scoring-logs-repository";

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
  const [profile, predictions, matches, macroScoringLogs] = await Promise.all([
    usersRepository.findByUserId(userId),
    predictionsRepository.listPredictionsByUser(userId),
    matchesRepository.listMatches(),
    championScoringLogsRepository.listByUserId(userId)
  ]);

  const matchPoints = predictions.reduce((total, prediction) => total + prediction.pointsAwarded, 0);
  const macroPoints = macroScoringLogs.reduce((total, log) => total + log.totalPoints, 0);
  const totals = {
    totalPoints: profile?.totalPoints ?? matchPoints + macroPoints,
    macroPoints: profile?.macroPoints ?? macroPoints,
    matchPoints,
    exactHits: profile?.exactHits ?? 0,
    correctSigns: profile?.correctSigns ?? 0
  };

  if (!profile) {
    return {
      ...totals,
      totals,
      byStage: createEmptyStageTotals(macroPoints),
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
        userPredictionSummary: formatPredictionSummary(prediction.homeScorePred, prediction.awayScorePred),
        officialResultSummary: formatOfficialResultSummary(match?.homeScore90, match?.awayScore90, match?.status),
        points: prediction.pointsAwarded,
        scoredAt: prediction.scoredAt ?? prediction.updatedAt,
        breakdown: {
          exact90Hit: scoringBreakdown.exact90Points > 0,
          correctOutcome90Hit: scoringBreakdown.outcome90Points > 0,
          penaltyHit: (scoringBreakdown.penaltyBonusPoints ?? 0) > 0,
          pointsExact90: scoringBreakdown.exact90Points,
          pointsOutcome90: scoringBreakdown.outcome90Points,
          pointsPenalty: scoringBreakdown.penaltyBonusPoints ?? 0,
          pointsTotal: scoringBreakdown.totalPoints
        }
      };
    });

  const byStage = createEmptyStageTotals(macroPoints);

  for (const prediction of scoredPredictions) {
    const match = matchMap.get(prediction.matchId);

    if (!match) {
      continue;
    }

    byStage[match.stage] += prediction.pointsAwarded;
  }

  return {
    ...totals,
    totals,
    byStage,
    recentMatches
  };
}

function createEmptyStageTotals(macroPoints: number): PointsByStage {
  return {
    group: 0,
    R32: 0,
    R16: 0,
    QF: 0,
    SF: 0,
    BRONZE: 0,
    FINAL: 0,
    macro: macroPoints
  };
}

function formatPredictionSummary(homeScore: number, awayScore: number) {
  return `${homeScore}-${awayScore}`;
}

function formatOfficialResultSummary(
  homeScore90: number | null | undefined,
  awayScore90: number | null | undefined,
  status: StoredMatchStatus | undefined
) {
  if (homeScore90 === null || awayScore90 === null || homeScore90 === undefined || awayScore90 === undefined) {
    return status === "finished" || status === "corrected" ? "Resultado cargado" : "Pendiente";
  }

  return `${homeScore90}-${awayScore90}`;
}
