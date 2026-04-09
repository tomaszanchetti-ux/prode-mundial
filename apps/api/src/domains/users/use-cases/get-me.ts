import type { UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { usersRepository } from "../repositories/users-repository";

export function getMe(auth: AuthContext): Promise<UserProfile> {
  return usersRepository.findOrCreateByAuth(auth);
}
