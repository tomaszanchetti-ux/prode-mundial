/*
 * Tracks dismissal of the Home install card (EPIC 32 WS6 / 6b).
 *
 * Behaviour: card aparece al primer load. Si user dismissa con "Mas tarde",
 * vuelve a aparecer despues de INSTALL_RE_TRIGGER_DAYS dias. Sin TTL
 * permanente — el feedback pide "tono suave" pero con re-trigger sutil.
 */

import { dispatchPermissionDismissed } from "@/lib/permissions/permission-events";

const INSTALL_DISMISSED_AT_KEY = "prode_install_card_dismissed_at";
const INSTALL_RE_TRIGGER_DAYS = 3;

export function getInstallDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(INSTALL_DISMISSED_AT_KEY);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function markInstallDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_DISMISSED_AT_KEY, String(Date.now()));
  // Notifica al double-dismiss modal para que reevalue (EPIC 32 6d).
  dispatchPermissionDismissed();
}

export function shouldShowInstallCard(): boolean {
  const dismissedAt = getInstallDismissedAt();
  if (!dismissedAt) return true;
  const elapsedMs = Date.now() - dismissedAt;
  const reTriggerMs = INSTALL_RE_TRIGGER_DAYS * 24 * 60 * 60 * 1000;
  return elapsedMs >= reTriggerMs;
}
