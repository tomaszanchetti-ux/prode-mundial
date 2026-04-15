"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallState = {
  /** Evento nativo capturado (Chrome/Edge/Android). Null si aún no disparó o no aplica. */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** App ya corriendo en modo standalone (ya instalada). */
  isStandalone: boolean;
  /** iOS Safari: no soporta beforeinstallprompt → hay que guiar al usuario a "Agregar a pantalla de inicio". */
  isIOS: boolean;
  /** Se puede mostrar UI de instalación (no instalada y, o prompt disponible, o iOS). */
  canInstall: boolean;
};

export function useInstallPrompt() {
  const [state, setState] = useState<InstallState>({
    deferredPrompt: null,
    isStandalone: false,
    isIOS: false,
    canInstall: false
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setState((s) => ({
      ...s,
      isIOS,
      isStandalone,
      canInstall: !isStandalone && isIOS
    }));

    if (isStandalone) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setState((s) => ({
        ...s,
        deferredPrompt: event as BeforeInstallPromptEvent,
        canInstall: true
      }));
    }

    function onInstalled() {
      setState({
        deferredPrompt: null,
        isStandalone: true,
        isIOS,
        canInstall: false
      });
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!state.deferredPrompt) return "unavailable";
    await state.deferredPrompt.prompt();
    const choice = await state.deferredPrompt.userChoice;
    setState((s) => ({ ...s, deferredPrompt: null, canInstall: false }));
    return choice.outcome;
  }

  return {
    isStandalone: state.isStandalone,
    isIOS: state.isIOS,
    canInstall: state.canInstall,
    hasNativePrompt: state.deferredPrompt !== null,
    promptInstall
  };
}
