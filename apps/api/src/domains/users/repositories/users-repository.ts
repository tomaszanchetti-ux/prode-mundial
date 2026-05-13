import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import type { AuthContext } from "../../../server/auth/auth-context";
import { firestore } from "../../../server/firebase/firebase-admin";

type StoredProfile = UserProfile & {
  createdAt: string;
  updatedAt: string;
  stripeCustomerId: string | null;
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
    plan: "free",
    goldUpgradedAt: null,
    stripeCustomerId: null,
    createdAt: now,
    updatedAt: now
  };
}

// Normalize profiles created before the billing fields existed. Reading the
// raw Firestore doc may return undefined for plan/goldUpgradedAt/stripeCustomerId,
// so we default them here without a migration.
function normalizeStoredProfile(raw: Record<string, unknown>): StoredProfile {
  return {
    ...(raw as StoredProfile),
    plan: (raw.plan as StoredProfile["plan"]) ?? "free",
    goldUpgradedAt: (raw.goldUpgradedAt as string | null | undefined) ?? null,
    stripeCustomerId: (raw.stripeCustomerId as string | null | undefined) ?? null
  };
}

function toPublicProfile(profile: StoredProfile): UserProfile {
  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    stripeCustomerId: _stripeCustomerId,
    ...publicProfile
  } = profile;
  return publicProfile;
}

export class UsersRepository {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const snapshot = await usersCollection.doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    return toPublicProfile(normalizeStoredProfile(snapshot.data() as Record<string, unknown>));
  }

  async listByUserIds(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(userIds.map((userId) => usersCollection.doc(userId).get()));

    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) =>
        toPublicProfile(normalizeStoredProfile(snapshot.data() as Record<string, unknown>))
      );
  }

  async listProfiles(limit = 20): Promise<UserProfile[]> {
    const snapshot = await usersCollection.limit(limit).get();
    return snapshot.docs.map((doc) =>
      toPublicProfile(normalizeStoredProfile(doc.data() as Record<string, unknown>))
    );
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = await usersCollection.doc(profile.userId).get();
    const existing = snapshot.exists
      ? normalizeStoredProfile(snapshot.data() as Record<string, unknown>)
      : null;

    await usersCollection.doc(profile.userId).set({
      ...profile,
      stripeCustomerId: existing?.stripeCustomerId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
  }

  async findOrCreateByAuth(auth: AuthContext): Promise<UserProfile> {
    const ref = usersCollection.doc(auth.userId);
    const snapshot = await ref.get();

    if (snapshot.exists) {
      return toPublicProfile(normalizeStoredProfile(snapshot.data() as Record<string, unknown>));
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

    const existing = normalizeStoredProfile(snapshot.data() as Record<string, unknown>);
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

  async findStripeCustomerId(userId: string): Promise<string | null> {
    const snapshot = await usersCollection.doc(userId).get();
    if (!snapshot.exists) {
      return null;
    }
    return normalizeStoredProfile(snapshot.data() as Record<string, unknown>).stripeCustomerId;
  }

  async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await usersCollection.doc(userId).update({
      stripeCustomerId,
      updatedAt: new Date().toISOString()
    });
  }

  async markGold(userId: string, goldUpgradedAt: string): Promise<void> {
    await usersCollection.doc(userId).update({
      plan: "gold",
      goldUpgradedAt,
      updatedAt: new Date().toISOString()
    });
  }
}

export const usersRepository = new UsersRepository();
