"use client";

import { useState } from "react";
import { Button, Card } from "@prode/ui";
import { useInstallPrompt } from "./use-install-prompt";

export function InstallAppCard() {
  const { canInstall, hasNativePrompt, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (isStandalone || !canInstall) return null;

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setFeedback("¡Listo! La app se está instalando.");
    } else if (outcome === "dismissed") {
      setFeedback("Podés instalarla cuando quieras desde acá.");
    }
  }

  return (
    <Card elevated style={{ gap: 12, padding: 20 }}>
      <span className="typo-small text-primary-500">INSTALAR APP</span>
      <p className="typo-body m-0 text-text-secondary">
        Instalala en tu celular para abrirla como una app, sin barra del navegador y con acceso directo desde el home.
      </p>

      {hasNativePrompt ? (
        <Button onClick={handleInstall}>Instalar Prode</Button>
      ) : isIOS ? (
        <div className="p-[14px] surface-inset text-text-secondary text-[14px] leading-[1.45] grid gap-1">
          <strong className="text-text-primary">En iPhone / iPad:</strong>
          <span>
            Tocá el botón <strong>Compartir</strong> en Safari y elegí{" "}
            <strong>Agregar a pantalla de inicio</strong>.
          </span>
        </div>
      ) : null}

      {feedback ? (
        <span className="typo-small text-text-secondary">{feedback}</span>
      ) : null}
    </Card>
  );
}
