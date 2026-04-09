import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";

type StoredProfile = UserProfile;

function buildDefaultProfile(auth: AuthContext): StoredProfile {
  return {
    userId: auth.userId,
    displayName: auth.displayName,
    email: auth.email,
    country: null,
    photoUrl: null,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: false
  };
}

export class UsersRepository {
  private readonly users = new Map<string, StoredProfile>();

  findOrCreateByAuth(auth: AuthContext): StoredProfile {
    const existing = this.users.get(auth.userId);

    if (existing) {
      return existing;
    }

    const profile = buildDefaultProfile(auth);
    this.users.set(auth.userId, profile);
    return profile;
  }

  updateProfile(userId: string, input: UpdateProfileInput): StoredProfile {
    const existing = this.users.get(userId);

    if (!existing) {
      throw new Error(`Cannot update missing profile for user ${userId}.`);
    }

    const updated: StoredProfile = {
      ...existing,
      displayName: input.displayName,
      country: input.country ?? null,
      profileCompleted: input.displayName.trim().length > 0
    };

    this.users.set(userId, updated);
    return updated;
  }
}

export const usersRepository = new UsersRepository();
