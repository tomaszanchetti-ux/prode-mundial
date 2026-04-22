"use client";

import { useEffect, useState } from "react";
import { Button } from "@prode/ui";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import {
  FIRST_PICK_COMPLETED_EVENT,
  getPicksCount,
  hasPostPickPromptBeenShown,
  markPostPickPromptShown
} from "@/lib/pwa/pick-install-trigger";
import { InstallIOSModal } from "./install-ios-modal";
import { useInstallPrompt } from "./use-install-prompt";

type ViewState = "hidden" | "visible" | "pending";

export function InstallAfterPickPrompt() {
  const { locale } = useLocale();
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [state, setState] = useState<ViewState>("hidden");
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone || !canInstall) return;
    if (hasPostPickPromptBeenShown()) return;

    // Safety net: if a pick was recorded before this component mounted
    // (race at hydration), show the prompt anyway on mount.
    if (getPicksCount() >= 1) {
      setState("visible");
      track("install_post_pick_shown");
      return;
    }

    function onFirstPick() {
      if (isStandalone || !canInstall) return;
      if (hasPostPickPromptBeenShown()) return;
      setState("visible");
      track("install_post_pick_shown");
    }

    window.addEventListener(FIRST_PICK_COMPLETED_EVENT, onFirstPick);
    return () => window.removeEventListener(FIRST_PICK_COMPLETED_EVENT, onFirstPick);
  }, [canInstall, isStandalone]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (state !== "visible") return;
    document.body.classList.add("prediction-modal-open");
    return () => {
      document.body.classList.remove("prediction-modal-open");
    };
  }, [state]);

  if (state === "hidden") {
    return <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />;
  }

  const close = () => {
    markPostPickPromptShown();
    setState("hidden");
  };

  const handleInstall = async () => {
    if (!hasNativePrompt) return;
    setState("pending");
    track("install_post_pick_accepted");
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      track("install_post_pick_installed");
    } else {
      track("install_post_pick_rejected");
    }
    close();
  };

  const handleShowIOS = () => {
    track("install_post_pick_ios_hint_opened");
    markPostPickPromptShown();
    setState("hidden");
    setIosModalOpen(true);
  };

  const handleDismiss = () => {
    track("install_post_pick_dismissed");
    close();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-post-pick-title"
        className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        <div className="w-full max-w-[420px] max-h-[92vh] overflow-y-auto card-base grid gap-4 shadow-modal rounded-xl modal-content-bg modal-sheet-enter p-5 text-center">
          <div className="text-4xl mx-auto" aria-hidden>
            🎯
          </div>
          <div className="grid gap-1">
            <h2 id="install-post-pick-title" className="typo-h3 m-0 text-text-primary">
              {copyForLocale(locale, "¡Primer pick guardado!", "First pick saved!")}
            </h2>
            <p className="typo-body m-0 text-text-secondary">
              {copyForLocale(
                locale,
                "Instalá Prode en tu celular para no perderte ningún partido.",
                "Install Prode on your phone so you don't miss any match."
              )}
            </p>
          </div>

          <div className="grid gap-2">
            {hasNativePrompt ? (
              <Button variant="primary" onClick={handleInstall} loading={state === "pending"}>
                {copyForLocale(locale, "Instalar Prode", "Install Prode")}
              </Button>
            ) : isIOS ? (
              <Button variant="primary" onClick={handleShowIOS}>
                {copyForLocale(locale, "Cómo instalar en iPhone", "How to install on iPhone")}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleDismiss} disabled={state === "pending"}>
              {copyForLocale(locale, "Después", "Later")}
            </Button>
          </div>
        </div>
      </div>

      <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
    </>
  );
}
