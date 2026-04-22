import type { ConsentState } from "@prode/shared";

// Consumers: EPIC 28 (Ads gating) + any component that needs to read consent state
// without re-implementing the accepted/denied check.
export function isAdsConsented(state: ConsentState | null): boolean {
  return state?.ads === "accepted";
}

export function isAnalyticsConsented(state: ConsentState | null): boolean {
  return state?.analytics === "accepted";
}
