"use client";

import Link from "next/link";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

export default function OfflinePage() {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  function handleRetry() {
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="grid gap-5 max-w-[420px] text-center">
        <div className="grid gap-2">
          <span className="typo-eyebrow text-primary-500">{t("SIN CONEXIÓN", "OFFLINE")}</span>
          <h1 className="typo-h2 m-0 text-text-primary">
            {t("Estás jugando en offline", "You're playing offline")}
          </h1>
          <p className="typo-body m-0 text-text-secondary">
            {t(
              "No pudimos llegar al servidor. Revisá tu conexión y volvé a intentarlo — tus pronósticos guardados siguen esperándote.",
              "We couldn't reach the server. Check your connection and try again — your saved predictions are still waiting for you."
            )}
          </p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="h-11 px-4 rounded-lg bg-primary-500 text-white font-semibold active:scale-[0.98] transition"
          >
            {t("Reintentar", "Retry")}
          </button>
          <Link
            href="/"
            className="typo-small text-text-secondary no-underline"
          >
            {t("Volver al inicio", "Back to home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
