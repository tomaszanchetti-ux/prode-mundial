import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { usersRepository } from "../repositories/users-repository";

export async function updateMe(auth: AuthContext, input: UpdateProfileInput): Promise<UserProfile> {
  await usersRepository.findOrCreateByAuth(auth);
  return usersRepository.updateProfile(auth.userId, input);
}
