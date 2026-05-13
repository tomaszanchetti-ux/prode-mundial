import { useAuth } from "@/components/auth/auth-provider";

/**
 * Returns true when the current user is on the Gold plan. Used by the future
 * AdSense slot (EPIC 28) to skip rendering ads for paying users. Until EPIC 28
 * lands, AdSlotCard placeholders ignore this — they are decorative.
 */
export function useIsGoldUser(): boolean {
  const { profile } = useAuth();
  return profile?.plan === "gold";
}
