import "../../../env";
import { LEAGUE_MEMBER_LIMIT } from "@prode/shared";
import { collectionsHaveWorldCupBaseData, seedWorldCup2026 } from "../../matches/scripts/world-cup-2026-seed-lib";
import { matchesRepository } from "../../matches/repositories/matches-repository";
import { predictionsRepository } from "../../matches/repositories/predictions-repository";
import { scoreMatch } from "../../matches/services/score-match";
import { usersRepository } from "../../users/repositories/users-repository";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { leaguesRepository } from "../repositories/leagues-repository";
import {
  buildInviteLink,
  buildMembershipId,
  DEMO_ANCHOR_FALLBACK,
  DEMO_GUEST_USERS,
  DEMO_LEAGUES,
  DEMO_MATCH_IDS
} from "./competition-demo-lib";

async function ensureBaseMatches() {
  const baseData = await collectionsHaveWorldCupBaseData();

  if (baseData.matches && baseData.teams && baseData.groups) {
    return;
  }

  await seedWorldCup2026(new Date().toISOString());
}

async function resolveAnchorUser() {
  const explicitUserId = process.argv.find((argument) => argument.startsWith("--userId="))?.split("=")[1]?.trim();

  if (explicitUserId) {
    const profile = await usersRepository.findByUserId(explicitUserId);

    if (!profile) {
      throw new Error(`User ${explicitUserId} does not exist in users collection.`);
    }

    return profile;
  }

  const candidates = await usersRepository.listByUserIds(
    ["usr_demo_anchor", "usr_demo_guest_1", "usr_demo_guest_2", "usr_demo_guest_3"].filter(Boolean)
  );

  if (candidates[0]) {
    return candidates[0];
  }

  const existingProfiles = await usersRepository.listProfiles(5);

  if (existingProfiles[0]) {
    return existingProfiles[0];
  }

  await usersRepository.upsertProfile(DEMO_ANCHOR_FALLBACK);
  return DEMO_ANCHOR_FALLBACK;
}

async function main() {
  await ensureBaseMatches();

  const nowIso = new Date().toISOString();
  const anchor = await resolveAnchorUser();
  const demoUsers = [anchor, ...DEMO_GUEST_USERS];

  await Promise.all(demoUsers.map((user) => usersRepository.upsertProfile(user)));

  const demoMatches = [
    {
      matchId: "demo_m_001",
      stage: "group" as const,
      groupId: "A",
      homeTeamId: "ARG",
      awayTeamId: "BRA",
      homeSlot: null,
      awaySlot: null,
      kickoffAt: "2026-06-12T19:00:00Z",
      kickoffAtEt: null,
      status: "finished" as const,
      homeScore90: 2,
      awayScore90: 1,
      winnerTeamId: "ARG",
      isLocked: true,
      isScored: false,
      sourceProvider: "demo",
      sourceLastSyncedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      matchId: "demo_m_002",
      stage: "QF" as const,
      groupId: null,
      homeTeamId: "ESP",
      awayTeamId: "FRA",
      homeSlot: null,
      awaySlot: null,
      kickoffAt: "2026-07-03T19:00:00Z",
      kickoffAtEt: null,
      status: "finished" as const,
      homeScore90: 1,
      awayScore90: 1,
      winnerTeamId: "ESP",
      isLocked: true,
      isScored: false,
      sourceProvider: "demo",
      sourceLastSyncedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  await Promise.all(demoMatches.map((match) => matchesRepository.upsertMatch(match)));

  const leagues = [
    {
      leagueId: DEMO_LEAGUES[0].leagueId,
      name: DEMO_LEAGUES[0].name,
      ownerUserId: anchor.userId,
      memberLimit: LEAGUE_MEMBER_LIMIT,
      inviteCode: DEMO_LEAGUES[0].inviteCode,
      inviteToken: DEMO_LEAGUES[0].inviteToken,
      inviteLink: buildInviteLink(DEMO_LEAGUES[0].inviteToken),
      isActive: true,
      archivedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      leagueId: DEMO_LEAGUES[1].leagueId,
      name: DEMO_LEAGUES[1].name,
      ownerUserId: DEMO_GUEST_USERS[0].userId,
      memberLimit: LEAGUE_MEMBER_LIMIT,
      inviteCode: DEMO_LEAGUES[1].inviteCode,
      inviteToken: DEMO_LEAGUES[1].inviteToken,
      inviteLink: buildInviteLink(DEMO_LEAGUES[1].inviteToken),
      isActive: true,
      archivedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  await Promise.all(leagues.map((league) => leaguesRepository.upsertLeague(league)));

  const memberships = [
    { leagueId: leagues[0].leagueId, userId: anchor.userId, role: "owner" as const },
    { leagueId: leagues[0].leagueId, userId: DEMO_GUEST_USERS[0].userId, role: "member" as const },
    { leagueId: leagues[0].leagueId, userId: DEMO_GUEST_USERS[1].userId, role: "member" as const },
    { leagueId: leagues[1].leagueId, userId: DEMO_GUEST_USERS[0].userId, role: "owner" as const },
    { leagueId: leagues[1].leagueId, userId: anchor.userId, role: "member" as const },
    { leagueId: leagues[1].leagueId, userId: DEMO_GUEST_USERS[2].userId, role: "member" as const }
  ];

  await Promise.all(
    memberships.map((membership) =>
      leagueMembersRepository.upsertMembership({
        membershipId: buildMembershipId(membership.leagueId, membership.userId),
        leagueId: membership.leagueId,
        userId: membership.userId,
        role: membership.role,
        joinedAt: nowIso
      })
    )
  );

  const predictions = [
    ["demo_m_001", anchor.userId, { homeScorePred: 2, awayScorePred: 1 }],
    ["demo_m_001", DEMO_GUEST_USERS[0].userId, { homeScorePred: 1, awayScorePred: 0 }],
    ["demo_m_001", DEMO_GUEST_USERS[1].userId, { homeScorePred: 0, awayScorePred: 1 }],
    ["demo_m_001", DEMO_GUEST_USERS[2].userId, { homeScorePred: 2, awayScorePred: 1 }],
    ["demo_m_002", anchor.userId, { homeScorePred: 1, awayScorePred: 1 }],
    ["demo_m_002", DEMO_GUEST_USERS[0].userId, { homeScorePred: 0, awayScorePred: 0 }],
    ["demo_m_002", DEMO_GUEST_USERS[1].userId, { homeScorePred: 1, awayScorePred: 1 }],
    ["demo_m_002", DEMO_GUEST_USERS[2].userId, { homeScorePred: 2, awayScorePred: 1 }]
  ] as const;

  await Promise.all(
    predictions.map(([matchId, userId, input]) => predictionsRepository.upsertPrediction(userId, matchId, input))
  );

  const scoreResults = await Promise.all(demoMatches.map((match) => scoreMatch(match.matchId, nowIso)));

  console.log(
    JSON.stringify(
      {
        anchorUserId: anchor.userId,
        leagues: leagues.map((league) => league.leagueId),
        demoMatches: [...DEMO_MATCH_IDS],
        scoreResults
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error("Failed to seed competition demo.");
  console.error(error);
  process.exitCode = 1;
});
