/*
 * Constante + helper compartido por install-card-tracker, notif-card-tracker
 * y double-dismiss-modal para coordinar el modal post-doble-dismiss.
 *
 * Vive aca (no en double-dismiss-tracker) para evitar circular import:
 * double-dismiss-tracker importa de install/notif trackers, e install/notif
 * trackers necesitan disparar el event.
 */

export const PERMISSION_DISMISSED_EVENT = "prode:permission_dismissed";

export function dispatchPermissionDismissed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PERMISSION_DISMISSED_EVENT));
}
