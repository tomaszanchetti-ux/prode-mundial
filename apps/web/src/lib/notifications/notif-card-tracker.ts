/*
 * Tracks dismissal/activation of the Home notif card (EPIC 32 WS6 / 6c).
 *
 * Comportamiento:
 *   - Si user activo notif → activated permanente, nunca mas se muestra.
 *   - Si user dismissa con "Ahora no" → vuelve cuando arranca el Mundial
 *     (kickoff del primer match), nunca antes.
 *   - El gate de "7 dias desde primer login" se chequea desde el componente
 *     usando getDaysSinceFirstLogin (no es responsabilidad del tracker).
 */

import { dispatchPermissionDismissed } from "@/lib/permissions/permission-events";

const NOTIF_DISMISSED_AT_KEY = "prode_notif_card_dismissed_at";
const NOTIF_ACTIVATED_KEY = "prode_notif_card_activated";

export function getNotifDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(NOTIF_DISMISSED_AT_KEY);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function markNotifDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIF_DISMISSED_AT_KEY, String(Date.now()));
  // Notifica al double-dismiss modal para que reevalue (EPIC 32 6d).
  dispatchPermissionDismissed();
}

export function wasNotifActivated(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NOTIF_ACTIVATED_KEY) === "1";
}

export function markNotifActivated(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIF_ACTIVATED_KEY, "1");
}

/*
 * tournamentStartAt: timestamp ms del primer match del torneo (kickoff).
 * Si null (no hay matches cargados) se asume que el torneo no arranco aun.
 */
export function shouldShowNotifCard(tournamentStartAt: number | null): boolean {
  if (wasNotifActivated()) return false;
  const dismissedAt = getNotifDismissedAt();
  if (!dismissedAt) return true;
  // Dismissed: solo re-trigger cuando arranca el Mundial.
  if (tournamentStartAt === null) return false;
  return Date.now() >= tournamentStartAt;
}
