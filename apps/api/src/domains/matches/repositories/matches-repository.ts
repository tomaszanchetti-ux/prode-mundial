import type { MatchStage } from "@prode/shared";
import { firestore } from "../../../server/firebase/firebase-admin";
import type { MatchesRepositoryListInput, StoredMatch } from "../types";

const matchesCollection = firestore.collection("matches");

function compareMatches(left: StoredMatch, right: StoredMatch) {
  const kickoffDiff = left.kickoffAt.localeCompare(right.kickoffAt);

  if (kickoffDiff !== 0) {
    return kickoffDiff;
  }

  return left.matchId.localeCompare(right.matchId);
}

export class MatchesRepository {
  async listMatches(input: MatchesRepositoryListInput = {}): Promise<StoredMatch[]> {
    const snapshot = await matchesCollection.get();
    const matches = snapshot.docs.map((doc) => doc.data() as StoredMatch);

    return matches
      .filter((match) => this.matchesStageFilter(match.stage, input.stage))
      .sort(compareMatches);
  }

  async getMatchById(matchId: string): Promise<StoredMatch | null> {
    const snapshot = await matchesCollection.doc(matchId).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as StoredMatch;
  }

  async upsertMatch(match: StoredMatch): Promise<void> {
    await matchesCollection.doc(match.matchId).set(match, { merge: true });
  }

  private matchesStageFilter(stage: MatchStage, requestedStage?: MatchStage) {
    return !requestedStage || stage === requestedStage;
  }
}

export const matchesRepository = new MatchesRepository();
