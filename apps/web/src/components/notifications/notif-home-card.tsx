"use client";

import React, { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { Button, Card } from "@prode/ui";
import { registerFcmToken } from "@/lib/api/client";
import { getDaysSinceFirstLogin } from "@/lib/auth/first-login-tracker";
import { track } from "@/lib/firebase/analytics";
import { getFcmToken, requestNotificationPermission } from "@/lib/firebase/messaging";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import {
  markNotifActivated,
  markNotifDismissed,
  shouldShowNotifCard
} from "@/lib/notifications/notif-card-tracker";

const ENGAGEMENT_DAYS_THRESHOLD = 7;

type ViewState = "hidden" | "visible" | "pending" | "success" | "denied" | "error";

type Props = {
  user: FirebaseUser | null;
  // Timestamp ms del primer kickoff del torneo. Null si no hay matches cargados.
  tournamentStartAt: number | null;
};

/*
 * EPIC 32 WS6 / 6c — Notif card al top del Home.
 * Reemplaza el EnableNotificationsBanner top-bar (eliminado en 6a).
 *
 * Logica de timing:
 *   - Solo aparece si daysSinceFirstLogin >= 7 (engagement minimo).
 *   - Y si Notification.permission === "default" (no decidio aun).
 *   - Si user dismissa "Ahora no" → vuelve cuando arranca el Mundial.
 *   - Si user activa → permanente, nunca mas.
 */
export function NotifHomeCard({ user, tournamentStartAt }: Props) {
  const { locale } = useLocale();
  const [state, setState] = useState<ViewState>("hidden");

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;

    const days = getDaysSinceFirstLogin();
    if (days === null || days < ENGAGEMENT_DAYS_THRESHOLD) return;

    if (!shouldShowNotifCard(tournamentStartAt)) return;

    setState("visible");
    track("notif_home_card_shown");
  }, [user, tournamentStartAt]);

  if (state === "hidden" || !user) return null;

  const handleActivate = async () => {
    setState("pending");
    track("notif_home_card_accepted");

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      track("notif_home_card_permission_denied");
      setState("denied");
      window.setTimeout(() => setState("hidden"), 4000);
      return;
    }

    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      // Permission granted pero token no disponible (SW, VAPID o red FCM).
      // Tratamos como error temporal, no permanent denial.
      setState("error");
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
      track("notif_home_card_token_registered");
      markNotifActivated();
      setState("success");
      window.setTimeout(() => setState("hidden"), 2400);
    } catch (error) {
      // Falla de red al registrar el token: NO marcamos como dismissed
      // ni denied — vuelve a aparecer al proximo refresh.
      console.warn("[notif-home-card] register failed", error);
      setState("error");
      window.setTimeout(() => setState("hidden"), 4000);
    }
  };

  const handleDismiss = () => {
    markNotifDismissed();
    track("notif_home_card_dismissed");
    setState("hidden");
  };

  if (state === "success") {
    return (
      <Card style={{ gap: 8, padding: 16 }}>
        <p className="typo-body m-0 text-text-primary">
          {copyForLocale(
            locale,
            "Listo, vas a recibir un recordatorio antes de que cierre cada pronóstico.",
            "Done — you'll get a reminder before each pick closes."
          )}
        </p>
      </Card>
    );
  }

  if (state === "denied") {
    return (
      <Card style={{ gap: 8, padding: 16 }}>
        <p className="typo-body m-0 text-text-primary">
          {copyForLocale(
            locale,
            "No pudimos activarlas. Podés habilitarlas desde la configuración del navegador.",
            "Couldn't enable them. Turn them on from your browser settings."
          )}
        </p>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card style={{ gap: 8, padding: 16 }}>
        <p className="typo-body m-0 text-text-primary">
          {copyForLocale(
            locale,
            "Tuvimos un problema activándolas. Reintentá más tarde.",
            "Something went wrong enabling them. Try again later."
          )}
        </p>
      </Card>
    );
  }

  return (
    <Card style={{ gap: 10, padding: 16 }}>
      <div className="grid gap-1">
        <strong className="typo-body text-text-primary">
          {copyForLocale(locale, "Activá notificaciones", "Enable notifications")}
        </strong>
        <p className="typo-small m-0 text-text-secondary">
          {copyForLocale(
            locale,
            "Te avisamos antes de que cierre tu pronóstico.",
            "We'll ping you before your pick closes."
          )}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="primary" onClick={handleActivate} loading={state === "pending"}>
          {copyForLocale(locale, "Activar", "Enable")}
        </Button>
        <Button variant="secondary" onClick={handleDismiss} disabled={state === "pending"}>
          {copyForLocale(locale, "Ahora no", "Not now")}
        </Button>
      </div>
    </Card>
  );
}
