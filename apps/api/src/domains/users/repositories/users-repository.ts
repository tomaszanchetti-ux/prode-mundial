import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { firestore } from "../../../server/firebase/firebase-admin";

type StoredProfile = UserProfile & {
  createdAt: string;
  updatedAt: string;
};

const usersCollection = firestore.collection("users");

function buildDefaultProfile(auth: AuthContext): StoredProfile {
  const now = new Date().toISOString();

  return {
    userId: auth.userId,
    displayName: auth.displayName,
    email: auth.email,
    country: null,
    photoUrl: auth.photoUrl,
    totalPoints: 0,
    macroPoints: 0,
    exactHits: 0,
    correctSigns: 0,
    leaguesCount: 0,
    profileCompleted: auth.displayName.trim().length >= 2,
    createdAt: now,
    updatedAt: now
  };
}

function toPublicProfile(profile: StoredProfile): UserProfile {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...publicProfile } = profile;
  return publicProfile;
}

export class UsersRepository {
  async findOrCreateByAuth(auth: AuthContext): Promise<UserProfile> {
    const ref = usersCollection.doc(auth.userId);
    const snapshot = await ref.get();

    if (snapshot.exists) {
      return toPublicProfile(snapshot.data() as StoredProfile);
    }

    const profile = buildDefaultProfile(auth);
    await ref.set(profile);
    return toPublicProfile(profile);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const ref = usersCollection.doc(userId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new Error(`Cannot update missing profile for user ${userId}.`);
    }

    const existing = snapshot.data() as StoredProfile;
    const updated: StoredProfile = {
      ...existing,
      displayName: input.displayName,
      country: input.country ?? null,
      profileCompleted: input.displayName.trim().length > 0,
      updatedAt: new Date().toISOString()
    };

    await ref.set(updated);
    return toPublicProfile(updated);
  }
}

export const usersRepository = new UsersRepository();
