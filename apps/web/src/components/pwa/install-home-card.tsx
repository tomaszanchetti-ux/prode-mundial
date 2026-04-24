"use client";

import React, { useEffect, useState } from "react";
import { Button, Card } from "@prode/ui";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { markInstallDismissed, shouldShowInstallCard } from "@/lib/pwa/install-card-tracker";
import { InstallIOSModal } from "./install-ios-modal";
import { useInstallPrompt } from "./use-install-prompt";

type ViewState = "hidden" | "visible" | "pending";

/*
 * EPIC 32 WS6 / 6b — Install card al final del Home.
 * Reemplaza el InstallAppBanner top-bar (eliminado en 6a) y el
 * InstallAfterPickPrompt automatico (eliminado en 6a).
 *
 * Logica:
 *   - Aparece la primera vez al final del Home si PWA es instalable.
 *   - Si user clickea "Mas tarde", vuelve en 3 dias (markInstallDismissed).
 *   - Si "Instalar" → dispara prompt nativo o iOS modal.
 *   - Si standalone o no canInstall → null (nunca se muestra).
 *
 * Tono suave (Card sin elevated, sin fondo destacado).
 */
export function InstallHomeCard() {
  const { locale } = useLocale();
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [state, setState] = useState<ViewState>("hidden");
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    if (isStandalone || !canInstall) {
      setState("hidden");
      return;
    }
    if (!shouldShowInstallCard()) {
      setState("hidden");
      return;
    }
    setState("visible");
    track("install_home_card_shown");
  }, [canInstall, isStandalone]);

  if (state === "hidden" || isStandalone || !canInstall) return null;

  const handleInstall = async () => {
    if (!hasNativePrompt) return;
    setState("pending");
    track("install_home_card_accepted");

    const outcome = await promptInstall();
    if (outcome === "accepted") {
      track("install_home_card_installed");
      setState("hidden");
    } else {
      track("install_home_card_rejected");
      markInstallDismissed();
      setState("hidden");
    }
  };

  const handleShowIOSHint = () => {
    track("install_home_card_ios_hint_opened");
    setIosModalOpen(true);
  };

  const handleDismiss = () => {
    markInstallDismissed();
    track("install_home_card_dismissed");
    setState("hidden");
  };

  return (
    <>
      <Card style={{ gap: 10, padding: 16 }}>
        <div className="grid gap-1">
          <strong className="typo-body text-text-primary">
            {copyForLocale(locale, "Instalá Prode Mundial", "Install Prode Mundial")}
          </strong>
          <p className="typo-small m-0 text-text-secondary">
            {copyForLocale(
              locale,
              "Accedé más rápido desde tu pantalla de inicio.",
              "Access it faster from your home screen."
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasNativePrompt ? (
            <Button variant="primary" onClick={handleInstall} loading={state === "pending"}>
              {copyForLocale(locale, "Instalar", "Install")}
            </Button>
          ) : isIOS ? (
            <Button variant="primary" onClick={handleShowIOSHint}>
              {copyForLocale(locale, "Cómo instalar", "How to install")}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={handleDismiss} disabled={state === "pending"}>
            {copyForLocale(locale, "Más tarde", "Later")}
          </Button>
        </div>
      </Card>

      <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
    </>
  );
}
