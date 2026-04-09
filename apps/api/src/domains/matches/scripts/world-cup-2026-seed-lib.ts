import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_SOURCES,
  WORLD_CUP_2026_TEAMS,
  type WorldCup2026NormalizedMatch
} from "../data/world-cup-2026";
import normalizedSchedule from "../data/world-cup-2026-normalized-matches.json";
import { firestore } from "../../../server/firebase/firebase-admin";

type TeamSeed = {
  teamId: string;
  fifaCode: string;
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type GroupSeed = {
  groupId: string;
  name: string;
  teamIds: string[];
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
};

type MatchSeedStatus = "scheduled" | "live" | "finished";

type MatchSeed = {
  matchId: string;
  officialMatchNumber: number;
  stage: WorldCup2026NormalizedMatch["stage"];
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSlot: string | null;
  awaySlot: string | null;
  venueId: string;
  kickoffAt: string;
  kickoffAtEt: string;
  status: MatchSeedStatus;
  homeScore90: number | null;
  awayScore90: number | null;
  winnerTeamId: string | null;
  isLocked: boolean;
  isScored: boolean;
  sourceProvider: string | null;
  sourceLastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FirestoreWrite = {
  collection: "teams" | "groups" | "matches";
  docId: string;
  data: TeamSeed | GroupSeed | MatchSeed;
};

const BATCH_LIMIT = 450;
const NORMALIZED_MATCHES = normalizedSchedule.matches as WorldCup2026NormalizedMatch[];

const MATCH_STATE_OVERRIDES: Record<
  string,
  Partial<Pick<MatchSeed, "status" | "homeScore90" | "awayScore90" | "winnerTeamId" | "isLocked" | "isScored">>
> = {
  m_002: {
    status: "live",
    homeScore90: 1,
    awayScore90: 0,
    winnerTeamId: "KOR",
    isLocked: true,
    isScored: false
  },
  m_003: {
    status: "finished",
    homeScore90: 2,
    awayScore90: 1,
    winnerTeamId: "CAN",
    isLocked: true,
    isScored: true
  },
  m_004: {
    status: "finished",
    homeScore90: 0,
    awayScore90: 0,
    winnerTeamId: null,
    isLocked: true,
    isScored: false
  }
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildTeamSeeds(nowIso: string): TeamSeed[] {
  return WORLD_CUP_2026_TEAMS.map((team) => ({
    ...team,
    groupId: team.groupId ?? null,
    createdAt: nowIso,
    updatedAt: nowIso
  }));
}

function buildGroupSeeds(nowIso: string): GroupSeed[] {
  return WORLD_CUP_2026_GROUPS.map((group) => ({
    ...group,
    teamIds: [...group.teamIds],
    createdAt: nowIso,
    updatedAt: nowIso
  }));
}

function buildMatchSeed(match: WorldCup2026NormalizedMatch, nowIso: string): MatchSeed {
  const override = MATCH_STATE_OVERRIDES[match.matchId];
  const status = override?.status ?? match.status;
  const homeScore90 = override?.homeScore90 ?? null;
  const awayScore90 = override?.awayScore90 ?? null;
  const winnerTeamId = override && "winnerTeamId" in override ? override.winnerTeamId ?? null : null;
  const isLocked = override?.isLocked ?? match.isLocked;
  const isScored = override?.isScored ?? match.isScored;

  return {
    matchId: match.matchId,
    officialMatchNumber: match.officialMatchNumber,
    stage: match.stage,
    groupId: match.groupId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeSlot: match.homeSlot,
    awaySlot: match.awaySlot,
    venueId: match.venueId,
    kickoffAt: match.kickoffAtUtc,
    kickoffAtEt: match.kickoffAtEt,
    status,
    homeScore90,
    awayScore90,
    winnerTeamId,
    isLocked,
    isScored,
    sourceProvider: WORLD_CUP_2026_SOURCES[0]?.label ?? null,
    sourceLastSyncedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

function buildMatchSeeds(nowIso: string): MatchSeed[] {
  return NORMALIZED_MATCHES.map((match) => buildMatchSeed(match, nowIso));
}

function buildWrites(nowIso: string): FirestoreWrite[] {
  const teamWrites = buildTeamSeeds(nowIso).map<FirestoreWrite>((team) => ({
    collection: "teams",
    docId: team.teamId,
    data: team
  }));

  const groupWrites = buildGroupSeeds(nowIso).map<FirestoreWrite>((group) => ({
    collection: "groups",
    docId: group.groupId,
    data: group
  }));

  const matchWrites = buildMatchSeeds(nowIso).map<FirestoreWrite>((match) => ({
    collection: "matches",
    docId: match.matchId,
    data: match
  }));

  return [...teamWrites, ...groupWrites, ...matchWrites];
}

function summarizeMatches(matches: MatchSeed[]) {
  const byStatus = matches.reduce<Record<string, number>>((accumulator, match) => {
    accumulator[match.status] = (accumulator[match.status] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    total: matches.length,
    byStatus,
    representativeMatches: {
      openGroup: matches.find((match) => match.matchId === "m_001") ?? null,
      liveLocked: matches.find((match) => match.matchId === "m_002") ?? null,
      finishedScored: matches.find((match) => match.matchId === "m_003") ?? null,
      finishedUnscored: matches.find((match) => match.matchId === "m_004") ?? null,
      openKnockout: matches.find((match) => match.matchId === "m_073") ?? null
    }
  };
}

async function commitWrites(writes: FirestoreWrite[]) {
  for (const writesChunk of chunk(writes, BATCH_LIMIT)) {
    const batch = firestore.batch();

    for (const write of writesChunk) {
      const ref = firestore.collection(write.collection).doc(write.docId);
      batch.set(ref, write.data, { merge: true });
    }

    await batch.commit();
  }
}

export function buildWorldCup2026SeedSummary(nowIso = new Date().toISOString()) {
  const writes = buildWrites(nowIso);
  const matches = writes
    .filter((write): write is FirestoreWrite & { collection: "matches"; data: MatchSeed } => write.collection === "matches")
    .map((write) => write.data);

  return {
    writes,
    summary: {
      teams: WORLD_CUP_2026_TEAMS.length,
      groups: WORLD_CUP_2026_GROUPS.length,
      matches: summarizeMatches(matches)
    }
  };
}

export async function seedWorldCup2026(nowIso = new Date().toISOString()) {
  const { writes, summary } = buildWorldCup2026SeedSummary(nowIso);
  await commitWrites(writes);

  return {
    summary,
    counts: {
      teams: WORLD_CUP_2026_TEAMS.length,
      groups: WORLD_CUP_2026_GROUPS.length,
      matches: summary.matches.total
    }
  };
}

export async function collectionsHaveWorldCupBaseData() {
  const [matches, teams, groups] = await Promise.all(
    ["matches", "teams", "groups"].map((collection) => firestore.collection(collection).limit(1).get())
  );

  return {
    matches: matches.size > 0,
    teams: teams.size > 0,
    groups: groups.size > 0
  };
}
