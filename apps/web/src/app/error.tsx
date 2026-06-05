"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/firebase/analytics";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  useEffect(() => {
    console.error("[app-error]", error);
    track("app_error", {
      scope: "route-segment",
      digest: error.digest ?? null,
      message: error.message.slice(0, 200)
    });
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="grid gap-5 max-w-[420px] text-center">
        <div className="grid gap-2">
          <span className="typo-eyebrow text-primary-500">{t("ERROR INESPERADO", "UNEXPECTED ERROR")}</span>
          <h1 className="typo-h2 m-0 text-text-primary">
            {t("Algo se rompió de nuestro lado", "Something broke on our end")}
          </h1>
          <p className="typo-body m-0 text-text-secondary">
            {t(
              "Ya lo estamos mirando. Podés reintentar o volver al inicio — tus pronósticos guardados no se pierden.",
              "We're already looking into it. You can retry or go back home — your saved predictions are safe."
            )}
          </p>
          {error.digest ? (
            <p className="typo-caption m-0 text-text-secondary opacity-70">
              {t("ID del error", "Error ID")}: <code>{error.digest}</code>
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={reset}
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
