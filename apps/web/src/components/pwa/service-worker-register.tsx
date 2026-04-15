"use client";

import { useEffect } from "react";

/**
 * Registra el service worker en producción.
 * En dev NO se registra para evitar conflictos con HMR de Turbopack.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // No bloqueamos la app si falla — solo log en consola.
          // eslint-disable-next-line no-console
          console.warn("[sw] register failed", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
