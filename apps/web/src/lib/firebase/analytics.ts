import { getApp, getApps } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import { webConfig } from "@/config/app";

let analyticsPromise: Promise<Analytics | null> | null = null;
let readyAnalytics: Analytics | null = null;
let analyticsConsented = false;

function isClient() {
  return typeof window !== "undefined";
}

function hasMeasurementId() {
  return webConfig.firebase.measurementId.length > 0;
}

export function setAnalyticsConsent(granted: boolean): void {
  analyticsConsented = granted;
}

export function isAnalyticsConsented(): boolean {
  return analyticsConsented;
}

async function resolveAnalytics(): Promise<Analytics | null> {
  if (!isClient() || !hasMeasurementId() || getApps().length === 0) {
    return null;
  }

  const mod = await import("firebase/analytics");
  const supported = await mod.isSupported();
  if (!supported) return null;

  const instance = mod.getAnalytics(getApp());
  readyAnalytics = instance;
  return instance;
}

export function initAnalytics(): Promise<Analytics | null> {
  if (!analyticsConsented) {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = resolveAnalytics().catch((error) => {
      console.warn("[analytics] init failed", error);
      return null;
    });
  }
  return analyticsPromise;
}

export type TrackEvent =
  | "app_error"
  | "prediction_saved"
  | "champion_saved"
  | "sub_champion_saved"
  | "best_player_saved"
  | "league_created"
  | "league_joined"
  | "invite_shared"
  | "fcm_prompt_shown"
  | "fcm_prompt_accepted"
  | "fcm_prompt_dismissed"
  | "fcm_permission_denied"
  | "fcm_token_registered"
  | "install_banner_shown"
  | "install_banner_accepted"
  | "install_banner_installed"
  | "install_banner_rejected"
  | "install_banner_dismissed"
  | "install_banner_ios_hint_opened"
  | "install_post_pick_shown"
  | "install_post_pick_accepted"
  | "install_post_pick_installed"
  | "install_post_pick_rejected"
  | "install_post_pick_dismissed"
  | "install_post_pick_ios_hint_opened";

export function track(
  event: TrackEvent,
  params?: Record<string, string | number | boolean | null | undefined>
) {
  if (!isClient()) return;
  if (!analyticsConsented) return;

  const emit = async () => {
    const instance = readyAnalytics ?? (await initAnalytics());
    if (!instance) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(instance, event, params);
  };

  void emit().catch((error) => {
    console.warn("[analytics] track failed", { event, error });
  });
}
