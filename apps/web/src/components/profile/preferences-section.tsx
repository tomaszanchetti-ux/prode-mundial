"use client";

import React, { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { Card } from "@prode/ui";
import { registerFcmToken } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { getFcmToken, requestNotificationPermission } from "@/lib/firebase/messaging";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { markNotifActivated, wasNotifActivated } from "@/lib/notifications/notif-card-tracker";
import { InstallIOSModal } from "@/components/pwa/install-ios-modal";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";

type NotifState = "off" | "on" | "denied" | "pending" | "unsupported";

type Props = {
  user: FirebaseUser | null;
};

/*
 * EPIC 32 WS6 / 6d — Sección "Preferencias" en /profile.
 * 2 toggles independientes:
 *   - Notificaciones (activar permission + register FCM token)
 *   - Instalar la app (disparar install prompt o iOS hint)
 *
 * Patrones reusados: .consent-row, .consent-switch (globals.css).
 */
export function PreferencesSection({ user }: Props) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [notifState, setNotifState] = useState<NotifState>("off");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifState("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted" || wasNotifActivated()) {
      setNotifState("on");
    } else if (perm === "denied") {
      setNotifState("denied");
    } else {
      setNotifState("off");
    }
  }, []);

  const handleNotifToggle = async () => {
    if (!user) return;
    if (notifState === "on") {
      setFeedback(t("Para desactivarlas, ajustá los permisos en la configuración del navegador.", "To turn them off, adjust browser site settings."));
      return;
    }
    if (notifState === "denied") {
      setFeedback(t("Las bloqueaste antes. Habilitalas desde la configuración del navegador.", "You blocked them before. Re-enable from browser site settings."));
      return;
    }
    if (notifState === "unsupported") {
      setFeedback(t("Este navegador no soporta notificaciones.", "This browser doesn't support notifications."));
      return;
    }

    setNotifState("pending");
    setFeedback(null);
    track("profile_notif_toggle_clicked");

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      setNotifState(permission === "denied" ? "denied" : "off");
      setFeedback(t("No pudimos activarlas.", "Couldn't enable them."));
      return;
    }

    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      setNotifState("denied");
      setFeedback(t("No pudimos obtener el token. Reintenta más tarde.", "Couldn't get token. Try again later."));
      return;
    }

    try {
      const authToken = await user.getIdToken();
      await registerFcmToken(authToken, {
        fcmToken,
        platform: "web",
        userAgent: navigator.userAgent
      });
      markNotifActivated();
      setNotifState("on");
      setFeedback(t("Listo, vas a recibir avisos antes de cada cierre.", "Done — you'll get pings before each pick closes."));
      track("profile_notif_activated");
    } catch (error) {
      console.warn("[preferences] register failed", error);
      setNotifState("off");
      setFeedback(t("No pudimos registrar tu dispositivo.", "Couldn't register your device."));
    }
  };

  const handleInstallToggle = async () => {
    if (isStandalone) {
      setFeedback(t("La app ya está instalada en este dispositivo.", "The app is already installed on this device."));
      return;
    }
    if (isIOS && !hasNativePrompt) {
      track("profile_install_ios_hint_opened");
      setIosModalOpen(true);
      return;
    }
    if (!canInstall || !hasNativePrompt) {
      setFeedback(t("La instalación no está disponible en este navegador.", "Install isn't available in this browser."));
      return;
    }
    track("profile_install_toggle_clicked");
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      track("profile_install_installed");
      setFeedback(t("¡Listo! La app se está instalando.", "Done! The app is installing."));
    } else {
      setFeedback(t("Podés instalarla cuando quieras desde acá.", "You can install it from here whenever you want."));
    }
  };

  const isNotifOn = notifState === "on";
  const isInstallOn = isStandalone;
  const showInstallRow = isStandalone || canInstall;

  return (
    <>
      <Card elevated style={{ gap: 6, padding: 16 }}>
        <span className="typo-eyebrow">{t("PREFERENCIAS", "PREFERENCES")}</span>

        {/* ── Notificaciones ── */}
        <div className="consent-row">
          <div className="consent-row-copy">
            <strong className="typo-body text-text-primary">
              {t("Notificaciones", "Notifications")}
            </strong>
            <span className="consent-row-hint">
              {t("Te avisamos antes de que cierre tu pronóstico.", "We'll ping you before your pick closes.")}
            </span>
          </div>
          <button
            type="button"
            className="consent-switch"
            data-checked={isNotifOn ? "true" : "false"}
            onClick={handleNotifToggle}
            aria-label={isNotifOn ? t("Desactivar notificaciones", "Disable notifications") : t("Activar notificaciones", "Enable notifications")}
            disabled={notifState === "pending"}
          >
            <span className="consent-switch-thumb" />
          </button>
        </div>

        {/* ── Instalar app ── (oculto si no aplica) */}
        {showInstallRow ? (
          <div className="consent-row">
            <div className="consent-row-copy">
              <strong className="typo-body text-text-primary">
                {t("Instalar la app", "Install the app")}
              </strong>
              <span className="consent-row-hint">
                {t("Accedé más rápido desde tu pantalla de inicio.", "Access it faster from your home screen.")}
              </span>
            </div>
            <button
              type="button"
              className="consent-switch"
              data-checked={isInstallOn ? "true" : "false"}
              onClick={handleInstallToggle}
              aria-label={isInstallOn ? t("App ya instalada", "App already installed") : t("Instalar la app", "Install the app")}
            >
              <span className="consent-switch-thumb" />
            </button>
          </div>
        ) : null}

        {feedback ? (
          <p className="typo-small m-0 text-text-secondary">{feedback}</p>
        ) : null}
      </Card>

      <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
    </>
  );
}
