"use client";

import React, { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { Button } from "@prode/ui";
import { registerFcmToken } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { getFcmToken, requestNotificationPermission } from "@/lib/firebase/messaging";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

const DISMISS_KEY = "prode_fcm_banner_dismissed_until";
const DISMISS_DAYS = 7;

function getDismissedUntil(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(DISMISS_KEY);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function setDismissedUntil(timestamp: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(timestamp));
}

type BannerState = "hidden" | "prompt" | "pending" | "success" | "denied";

type Props = { user: FirebaseUser | null };

export function EnableNotificationsBanner({ user }: Props) {
  const { locale } = useLocale();
  const [state, setState] = useState<BannerState>("hidden");

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    if (Notification.permission !== "default") return;

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && dismissedUntil > Date.now()) return;

    setState("prompt");
    track("fcm_prompt_shown");
  }, [user]);

  if (state === "hidden" || !user) return null;

  const handleActivate = async () => {
    setState("pending");
    track("fcm_prompt_accepted");

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      track("fcm_permission_denied");
      setState("denied");
      window.setTimeout(() => setState("hidden"), 4000);
      return;
    }

    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      setState("denied");
      window.setTimeout(() => setState("hidden"), 4000);
      return;
    }

    try {
      const authToken = await user.getIdToken();
      await registerFcmToken(authToken, {
        fcmToken,
        platform: "web",
        userAgent: navigator.userAgent
      });
      track("fcm_token_registered");
      setState("success");
      window.setTimeout(() => setState("hidden"), 2400);
    } catch (error) {
      console.warn("[banner] register failed", error);
      setState("denied");
      window.setTimeout(() => setState("hidden"), 4000);
    }
  };

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    setDismissedUntil(until);
    track("fcm_prompt_dismissed");
    setState("hidden");
  };

  if (state === "success") {
    return (
      <div className="rounded-lg border border-border-default bg-surface-raised px-4 py-3 flex items-start gap-3">
        <span className="text-xl" aria-hidden>✅</span>
        <p className="typo-body m-0 text-text-primary">
          {copyForLocale(
            locale,
            "Listo, vas a recibir un recordatorio antes de que cierre cada pronóstico.",
            "Done — you'll get a reminder before each pick closes."
          )}
        </p>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="rounded-lg border border-border-default bg-surface-raised px-4 py-3 flex items-start gap-3">
        <span className="text-xl" aria-hidden>ℹ️</span>
        <p className="typo-body m-0 text-text-primary">
          {copyForLocale(
            locale,
            "No pudimos activarlas. Podés habilitarlas desde la configuración del navegador.",
            "Couldn't enable them. Turn them on from your browser settings."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-surface-raised px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>🔔</span>
        <div className="grid gap-1">
          <strong className="typo-body text-text-primary">
            {copyForLocale(locale, "Activá notificaciones", "Enable notifications")}
          </strong>
          <p className="typo-small m-0 text-text-secondary">
            {copyForLocale(
              locale,
              "Te avisamos cuando esté por cerrar tu pronóstico.",
              "We'll ping you before each pick closes."
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-none">
        <Button variant="secondary" onClick={handleDismiss} disabled={state === "pending"}>
          {copyForLocale(locale, "Después", "Later")}
        </Button>
        <Button variant="primary" onClick={handleActivate} loading={state === "pending"}>
          {copyForLocale(locale, "Activar", "Enable")}
        </Button>
      </div>
    </div>
  );
}
