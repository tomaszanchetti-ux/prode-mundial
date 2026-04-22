import type { ConsentState } from "@prode/shared";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function updateGoogleConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  const adsGranted = state.ads === "accepted" ? "granted" : "denied";
  gtag("consent", "update", {
    analytics_storage: state.analytics === "accepted" ? "granted" : "denied",
    ad_storage: adsGranted,
    ad_user_data: adsGranted,
    ad_personalization: adsGranted
  });
}
