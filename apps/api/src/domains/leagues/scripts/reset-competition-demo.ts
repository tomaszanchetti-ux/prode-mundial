import "../../../env";
import { firestore } from "../../../server/firebase/firebase-admin";
import { leagueMembersRepository } from "../repositories/league-members-repository";
import { rebuildUserAggregates } from "../../users/services/user-aggregates";
import { usersRepository } from "../../users/repositories/users-repository";
import { DEMO_ANCHOR_FALLBACK, DEMO_GUEST_USERS, DEMO_LEAGUES, DEMO_MATCH_IDS, isDemoUser } from "./competition-demo-lib";

async function deleteDocIfExists(collectionName: string, docId: string) {
  const ref = firestore.collection(collectionName).doc(docId);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    await ref.delete();
    return true;
  }

  return false;
}

async function deleteStandingsForLeague(leagueId: string) {
  const snapshot = await firestore.collection("leagueStandings").doc(leagueId).collection("table").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  await firestore.collection("leagueStandings").doc(leagueId).delete().catch(() => undefined);
  return snapshot.size;
}

async function deletePredictionsForDemoMatches() {
  let deleted = 0;

  for (const matchId of DEMO_MATCH_IDS) {
    const snapshot = await firestore.collection("predictions").where("matchId", "==", matchId).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    deleted += snapshot.size;
  }

  return deleted;
}

async function recomputeLeaguesCount(userId: string) {
  const profile = await usersRepository.findByUserId(userId);

  if (!profile) {
    return null;
  }

  const memberships = await leagueMembersRepository.listMembershipsByUser(userId);
  const nextProfile = {
    ...profile,
    leaguesCount: memberships.length
  };

  await usersRepository.upsertProfile(nextProfile);
  return nextProfile;
}

async function main() {
  const explicitAnchorUserId = process.argv.find((argument) => argument.startsWith("--anchorUserId="))?.split("=")[1]?.trim() ?? null;
  const existingMemberships = (
    await Promise.all(DEMO_LEAGUES.map((league) => leagueMembersRepository.listMembershipsByLeague(league.leagueId)))
  ).flat();
  const inferredRealUsers = existingMemberships
    .map((membership) => membership.userId)
    .filter((userId) => !isDemoUser(userId));
  const anchorUserId = explicitAnchorUserId ?? inferredRealUsers[0] ?? null;

  const deletedPredictions = await deletePredictionsForDemoMatches();
  const deletedMatches = await Promise.all(DEMO_MATCH_IDS.map((matchId) => deleteDocIfExists("matches", matchId)));
  const deletedLeagues = await Promise.all(DEMO_LEAGUES.map((league) => deleteDocIfExists("leagues", league.leagueId)));
  const deletedMemberships = await Promise.all(
    DEMO_LEAGUES.flatMap((league) =>
      [anchorUserId, DEMO_ANCHOR_FALLBACK.userId, ...DEMO_GUEST_USERS.map((user) => user.userId)]
        .filter((userId): userId is string => Boolean(userId))
        .map((userId) => deleteDocIfExists("leagueMembers", `${league.leagueId}__${userId}`))
    )
  );
  const deletedStandings = await Promise.all(DEMO_LEAGUES.map((league) => deleteStandingsForLeague(league.leagueId)));

  const deletedUsers = await Promise.all(
    DEMO_GUEST_USERS.map((user) => deleteDocIfExists("users", user.userId))
  );

  if (!anchorUserId) {
    await deleteDocIfExists("users", DEMO_ANCHOR_FALLBACK.userId);
  }

  const affectedUsers = new Set<string>([...DEMO_GUEST_USERS.map((user) => user.userId), ...inferredRealUsers]);

  for (const userId of affectedUsers) {
    if (DEMO_GUEST_USERS.some((user) => user.userId === userId)) {
      continue;
    }

    await rebuildUserAggregates(userId);
    await recomputeLeaguesCount(userId);
  }

  console.log(
    JSON.stringify(
      {
        deletedPredictions,
        deletedMatches: deletedMatches.filter(Boolean).length,
        deletedLeagues: deletedLeagues.filter(Boolean).length,
        deletedMemberships: deletedMemberships.filter(Boolean).length,
        deletedStandings: deletedStandings.reduce((sum, value) => sum + value, 0),
        deletedUsers: deletedUsers.filter(Boolean).length,
        recomputedUsers: [...affectedUsers].filter((userId) => !DEMO_GUEST_USERS.some((user) => user.userId === userId))
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error("Failed to reset competition demo.");
  console.error(error);
  process.exitCode = 1;
});
