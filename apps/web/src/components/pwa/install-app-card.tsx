"use client";

import { useState } from "react";
import { Button, Card } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { InstallIOSModal } from "./install-ios-modal";
import { useInstallPrompt } from "./use-install-prompt";

export function InstallAppCard() {
  const { locale } = useLocale();
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  if (isStandalone || !canInstall) return null;

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setFeedback(
        copyForLocale(
          locale,
          "¡Listo! La app se está instalando.",
          "Done! The app is installing."
        )
      );
    } else if (outcome === "dismissed") {
      setFeedback(
        copyForLocale(
          locale,
          "Podés instalarla cuando quieras desde acá.",
          "You can install it from here whenever you want."
        )
      );
    }
  }

  return (
    <>
      <Card elevated style={{ gap: 12, padding: 20 }}>
        <span className="typo-small text-primary-500">
          {copyForLocale(locale, "INSTALAR APP", "INSTALL APP")}
        </span>
        <p className="typo-body m-0 text-text-secondary">
          {copyForLocale(
            locale,
            "Instalala en tu celular para abrirla como una app, sin barra del navegador y con acceso directo desde el home.",
            "Install it on your phone to open it as an app, without the browser bar and with direct access from your home screen."
          )}
        </p>

        {hasNativePrompt ? (
          <Button onClick={handleInstall}>
            {copyForLocale(locale, "Instalar Prode", "Install Prode")}
          </Button>
        ) : isIOS ? (
          <Button onClick={() => setIosModalOpen(true)}>
            {copyForLocale(locale, "Cómo instalar", "How to install")}
          </Button>
        ) : null}

        {feedback ? (
          <span className="typo-small text-text-secondary">{feedback}</span>
        ) : null}
      </Card>

      <InstallIOSModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
    </>
  );
}
