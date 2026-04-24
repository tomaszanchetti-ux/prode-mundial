/*
 * Tracks the first time the current browser sees an authenticated user.
 * Used by the permissions flow (EPIC 32 WS6) to delay the notif prompt
 * until the user has enough engagement (7+ days since first login).
 *
 * Storage: localStorage, per browser (not per-userId — we only need
 * "days since this device first saw an auth session").
 */

const FIRST_LOGIN_KEY = "prode_first_login_at";

export function getFirstLoginAt(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(FIRST_LOGIN_KEY);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function markFirstLogin(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FIRST_LOGIN_KEY)) return;
  window.localStorage.setItem(FIRST_LOGIN_KEY, String(Date.now()));
}

export function getDaysSinceFirstLogin(): number | null {
  const first = getFirstLoginAt();
  if (!first) return null;
  return Math.floor((Date.now() - first) / (1000 * 60 * 60 * 24));
}
