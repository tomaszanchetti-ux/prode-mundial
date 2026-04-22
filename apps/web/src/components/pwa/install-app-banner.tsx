"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@prode/ui";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { InstallIOSModal } from "./install-ios-modal";
import { useInstallPrompt } from "./use-install-prompt";

const DISMISS_KEY = "prode_install_banner_dismissed_until";
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

type BannerState = "visible" | "pending" | "hidden";

export function InstallAppBanner() {
  const { locale } = useLocale();
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [state, setState] = useState<BannerState>("hidden");
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [shownTracked, setShownTracked] = useState(false);

  useEffect(() => {
    if (isStandalone || !canInstall) {
      setState("hidden");
      return;
    }

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && dismissedUntil > Date.now()) {
      setState("hidden");
      return;
    }

    setState("visible");
    if (!shownTracked) {
      track("install_banner_shown");
      setShownTracked(true);
    }
  }, [canInstall, isStandalone, shownTracked]);

  if (state === "hidden" || isStandalone || !canInstall) return null;

  const handleInstall = async () => {
    if (!hasNativePrompt) return;
    setState("pending");
    track("install_banner_accepted");

    const outcome = await promptInstall();
    if (outcome === "accepted") {
      track("install_banner_installed");
      setState("hidden");
    } else {
      track("install_banner_rejected");
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      setDismissedUntil(until);
      setState("hidden");
    }
  };

  const handleShowIOSHint = () => {
    track("install_banner_ios_hint_opened");
    setIosModalOpen(true);
  };

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    setDismissedUntil(until);
    track("install_banner_dismissed");
    setState("hidden");
  };

  return (
    <>
      <div className="rounded-lg border border-border-default bg-surface-raised px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>📲</span>
          <div className="grid gap-1">
            <strong className="typo-body text-text-primary">
              {copyForLocale(locale, "Instalá la app", "Install the app")}
            </strong>
            <p className="typo-small m-0 text-text-secondary">
              {copyForLocale(
                locale,
                "Acceso directo desde tu home, sin barra del navegador.",
                "Quick access from your home screen, no browser bar."
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-none">
          <Button variant="secondary" onClick={handleDismiss} disabled={state === "pending"}>
            {copyForLocale(locale, "Ahora no", "Not now")}
          </Button>
          {hasNativePrompt ? (
            <Button variant="primary" onClick={handleInstall} loading={state === "pending"}>
              {copyForLocale(locale, "Instalar", "Install")}
            </Button>
          ) : isIOS ? (
            <Button variant="primary" onClick={handleShowIOSHint}>
              {copyForLocale(locale, "Cómo instalar", "How to install")}
            </Button>
          ) : null}
        </div>
      </div>

      <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
    </>
  );
}
