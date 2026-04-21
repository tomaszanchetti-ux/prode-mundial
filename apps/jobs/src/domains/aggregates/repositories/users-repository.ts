import type { UserProfile } from "@prode/shared";
import { firestore } from "../../../firebase/firebase-admin";

type StoredProfile = UserProfile & {
  createdAt: string;
  updatedAt: string;
};

const usersCollection = firestore.collection("users");

function toPublicProfile(stored: StoredProfile): UserProfile {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...publicProfile } = stored;
  return publicProfile;
}

export class AggregatesUsersRepository {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const snapshot = await usersCollection.doc(userId).get();
    if (!snapshot.exists) return null;
    return toPublicProfile(snapshot.data() as StoredProfile);
  }

  async listByUserIds(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const snapshots = await Promise.all(userIds.map((id) => usersCollection.doc(id).get()));
    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => toPublicProfile(snapshot.data() as StoredProfile));
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = await usersCollection.doc(profile.userId).get();
    const existing = snapshot.exists ? (snapshot.data() as StoredProfile) : null;

    await usersCollection.doc(profile.userId).set({
      ...profile,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
  }
}

export const aggregatesUsersRepository = new AggregatesUsersRepository();
