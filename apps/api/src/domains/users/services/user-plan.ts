import { usersRepository } from "../repositories/users-repository";

export async function isUserPlanGold(userId: string): Promise<boolean> {
  const profile = await usersRepository.findByUserId(userId);
  return profile?.plan === "gold";
}
