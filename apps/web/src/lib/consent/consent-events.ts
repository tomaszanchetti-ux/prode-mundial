export const CONSENT_OPEN_PREFERENCES_EVENT = "prode:open-consent-preferences";

export function openConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_PREFERENCES_EVENT));
}
