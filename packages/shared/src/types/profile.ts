import type { UserPlan } from "./billing";

export type AuthProvider = "google" | "magic_link";

export type UserProfile = {
  userId: string;
  displayName: string;
  email: string;
  country: string | null;
  photoUrl: string | null;
  totalPoints: number;
  macroPoints: number;
  exactHits: number;
  correctSigns: number;
  leaguesCount: number;
  profileCompleted: boolean;
  plan: UserPlan;
  goldUpgradedAt: string | null;
};
