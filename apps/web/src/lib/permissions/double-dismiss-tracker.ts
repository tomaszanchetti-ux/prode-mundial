/*
 * Tracks the one-time "you can configure this in your Profile" modal
 * (EPIC 32 WS6 / 6d). Aparece SOLO cuando el user dismisso ambas cards
 * (notif + install) y nunca antes vio este modal.
 *
 * Cada card dispara PERMISSION_DISMISSED_EVENT desde sus markXxxDismissed
 * helpers — el modal escucha y reevalua su condicion.
 */

import { getInstallDismissedAt } from "@/lib/pwa/install-card-tracker";
import { getNotifDismissedAt } from "@/lib/notifications/notif-card-tracker";

const DOUBLE_MODAL_SHOWN_KEY = "prode_double_dismiss_modal_shown";

export function hasDoubleModalBeenShown(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DOUBLE_MODAL_SHOWN_KEY) === "1";
}

export function markDoubleModalShown(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOUBLE_MODAL_SHOWN_KEY, "1");
}

export function shouldShowDoubleModal(): boolean {
  if (hasDoubleModalBeenShown()) return false;
  return getInstallDismissedAt() !== null && getNotifDismissedAt() !== null;
}
