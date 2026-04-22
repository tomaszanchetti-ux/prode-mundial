export const CONSENT_STORAGE_KEY = "prode_consent_v1";
export const CONSENT_VERSION = 1;

export type ConsentCategory = "necessary" | "analytics" | "ads";

export type ConsentDecision = "accepted" | "denied";

export interface ConsentState {
  version: number;
  decidedAt: string;
  analytics: ConsentDecision;
  ads: ConsentDecision;
}

export function defaultDeniedConsent(): ConsentState {
  return {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    analytics: "denied",
    ads: "denied"
  };
}

export function allAcceptedConsent(): ConsentState {
  return {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    analytics: "accepted",
    ads: "accepted"
  };
}

export function allDeniedConsent(): ConsentState {
  return defaultDeniedConsent();
}

export function isConsentValid(value: unknown): value is ConsentState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === CONSENT_VERSION &&
    typeof v.decidedAt === "string" &&
    (v.analytics === "accepted" || v.analytics === "denied") &&
    (v.ads === "accepted" || v.ads === "denied")
  );
}

export function hasConsent(
  state: ConsentState | null,
  category: Exclude<ConsentCategory, "necessary">
): boolean {
  if (!state) return false;
  return state[category] === "accepted";
}
