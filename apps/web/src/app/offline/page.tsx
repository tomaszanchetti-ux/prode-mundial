"use client";

import Link from "next/link";

export default function OfflinePage() {
  function handleRetry() {
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="grid gap-5 max-w-[420px] text-center">
        <div className="grid gap-2">
          <span className="typo-small text-primary-500">SIN CONEXIÓN</span>
          <h1 className="typo-h2 m-0 text-text-primary">
            Estás jugando en offline
          </h1>
          <p className="typo-body m-0 text-text-secondary">
            No pudimos llegar al servidor. Revisá tu conexión y volvé a
            intentarlo — tus pronósticos guardados siguen esperándote.
          </p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={handleRetry}
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
