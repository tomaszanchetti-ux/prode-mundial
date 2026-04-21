import { usersRepository } from "../../users/repositories/users-repository";
import { leagueMembersRepository } from "../repositories/league-members-repository";

export async function syncUserLeaguesCount(userId: string) {
  const [profile, memberships] = await Promise.all([
    usersRepository.findByUserId(userId),
    leagueMembersRepository.listMembershipsByUser(userId)
  ]);

  if (!profile) {
    return;
  }

  await usersRepository.upsertProfile({
    ...profile,
    leaguesCount: memberships.length
  });
}
