/**
 * Simulates a knockout bracket (R32 → Final) from user predictions.
 *
 * Winner resolution from a prediction:
 *   - homeScorePred > awayScorePred → home wins
 *   - homeScorePred < awayScorePred → away wins
 *   - draw                          → unresolved (bracket no avanza; el user
 *                                      queda sin proyección hasta que la
 *                                      ronda se ancle con el resultado real)
 */

export type KnockoutStage = "R32" | "R16" | "QF" | "SF" | "BRONZE" | "FINAL";

export type BracketSimulatorMatch = {
  matchId: string;
  stage: KnockoutStage;
  officialMatchNumber: number;
  homeSlot: string | null;
  awaySlot: string | null;
  /**
   * Pre-anchored team IDs. When set, they override slot resolution.
   * Typical sources:
   *   - R32: output of resolveR32Bracket (user-projected or official).
   *   - Later rounds: the round has been officially closed, so real teams
   *     replace the projected ones.
   */
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type BracketSimulatorPrediction = {
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
};

export type SimulatedMatchSource = "anchored" | "projected" | "unresolved";

export type SimulatedKnockoutMatch = {
  matchId: string;
  stage: KnockoutStage;
  officialMatchNumber: number;
  homeSlot: string | null;
  awaySlot: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  /**
   * - "anchored": both teams came from the input's homeTeamId/awayTeamId.
   * - "projected": at least one team was derived from an earlier round's
   *   predicted winner/loser.
   * - "unresolved": one or both teams could not be determined (missing
   *   prediction upstream, invalid slot, or invalid draw qualifier).
   */
  source: SimulatedMatchSource;
};

export type BracketSimulation = {
  matches: SimulatedKnockoutMatch[];
  unresolvedMatchIds: string[];
};

const STAGE_ORDER: KnockoutStage[] = ["R32", "R16", "QF", "SF", "BRONZE", "FINAL"];

function isStage(value: string): value is KnockoutStage {
  return (STAGE_ORDER as string[]).includes(value);
}

function resolveWinnerFromPrediction(
  homeTeamId: string,
  awayTeamId: string,
  prediction: BracketSimulatorPrediction | undefined
): { winnerTeamId: string; loserTeamId: string } | null {
  if (!prediction) {
    return null;
  }

  if (prediction.homeScorePred > prediction.awayScorePred) {
    return { winnerTeamId: homeTeamId, loserTeamId: awayTeamId };
  }

  if (prediction.homeScorePred < prediction.awayScorePred) {
    return { winnerTeamId: awayTeamId, loserTeamId: homeTeamId };
  }

  return null;
}

function parseOrdinalReferenceSlot(
  slot: string
): { kind: "winner" | "loser"; matchNumber: number } | null {
  const match = /^([WL])(\d+)$/.exec(slot);

  if (!match) {
    return null;
  }

  const kind = match[1] === "W" ? "winner" : "loser";
  const matchNumber = Number.parseInt(match[2], 10);

  return { kind, matchNumber };
}

export function simulateKnockoutBracket(params: {
  matches: BracketSimulatorMatch[];
  predictions: BracketSimulatorPrediction[];
}): BracketSimulation {
  const { matches, predictions } = params;

  const predictionsByMatchId = new Map<string, BracketSimulatorPrediction>();

  for (const prediction of predictions) {
    predictionsByMatchId.set(prediction.matchId, prediction);
  }

  const matchByOfficialNumber = new Map<number, BracketSimulatorMatch>();

  for (const match of matches) {
    matchByOfficialNumber.set(match.officialMatchNumber, match);
  }

  const winnerByMatchId = new Map<string, string>();
  const loserByMatchId = new Map<string, string>();

  function resolveSlot(slot: string | null): string | null {
    if (!slot) {
      return null;
    }

    const ordinalReference = parseOrdinalReferenceSlot(slot);

    if (!ordinalReference) {
      return null;
    }

    const sourceMatch = matchByOfficialNumber.get(ordinalReference.matchNumber);

    if (!sourceMatch) {
      return null;
    }

    const map = ordinalReference.kind === "winner" ? winnerByMatchId : loserByMatchId;

    return map.get(sourceMatch.matchId) ?? null;
  }

  const simulated: SimulatedKnockoutMatch[] = [];

  for (const stage of STAGE_ORDER) {
    const stageMatches = matches
      .filter((match) => match.stage === stage)
      .sort((left, right) => left.officialMatchNumber - right.officialMatchNumber);

    for (const match of stageMatches) {
      const anchoredHome = match.homeTeamId;
      const anchoredAway = match.awayTeamId;

      const resolvedHome = anchoredHome ?? resolveSlot(match.homeSlot);
      const resolvedAway = anchoredAway ?? resolveSlot(match.awaySlot);

      let winner: string | null = null;
      let loser: string | null = null;

      if (resolvedHome && resolvedAway) {
        const outcome = resolveWinnerFromPrediction(
          resolvedHome,
          resolvedAway,
          predictionsByMatchId.get(match.matchId)
        );

        if (outcome) {
          winner = outcome.winnerTeamId;
          loser = outcome.loserTeamId;
          winnerByMatchId.set(match.matchId, winner);
          loserByMatchId.set(match.matchId, loser);
        }
      }

      const bothAnchored = anchoredHome !== null && anchoredAway !== null;
      const bothResolved = resolvedHome !== null && resolvedAway !== null;

      const source: SimulatedMatchSource = bothAnchored
        ? "anchored"
        : bothResolved
          ? "projected"
          : "unresolved";

      simulated.push({
        matchId: match.matchId,
        stage: match.stage,
        officialMatchNumber: match.officialMatchNumber,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot,
        homeTeamId: resolvedHome,
        awayTeamId: resolvedAway,
        winnerTeamId: winner,
        loserTeamId: loser,
        source
      });
    }
  }

  const unresolvedMatchIds = simulated
    .filter((match) => match.homeTeamId === null || match.awayTeamId === null)
    .map((match) => match.matchId);

  return {
    matches: simulated,
    unresolvedMatchIds
  };
}

export function isKnockoutStage(value: string): value is KnockoutStage {
  return isStage(value);
}
