import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { usersRepository } from "../repositories/users-repository";

export function updateMe(auth: AuthContext, input: UpdateProfileInput): UserProfile {
  usersRepository.findOrCreateByAuth(auth);
  return usersRepository.updateProfile(auth.userId, input);
}
