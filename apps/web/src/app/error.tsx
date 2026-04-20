"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/firebase/analytics";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
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
          <span className="typo-small text-primary-500">ERROR INESPERADO</span>
          <h1 className="typo-h2 m-0 text-text-primary">
            Algo se rompió de nuestro lado
          </h1>
          <p className="typo-body m-0 text-text-secondary">
            Ya lo estamos mirando. Podés reintentar o volver al inicio — tus
            pronósticos guardados no se pierden.
          </p>
          {error.digest ? (
            <p className="typo-caption m-0 text-text-secondary opacity-70">
              ID del error: <code>{error.digest}</code>
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-4 rounded-lg bg-primary-500 text-white font-semibold active:scale-[0.98] transition"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="typo-small text-text-secondary no-underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
