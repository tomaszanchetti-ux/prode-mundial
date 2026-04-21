"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SUPPORT_LINKS } from "@prode/shared";
import { Button } from "@prode/ui";
import { useAuth } from "./auth-provider";
import { resolveNextRoute } from "./login-screen";

/**
 * Landing minimalista (WS50 · Fase 2 ronda 2).
 * Un solo viewport, sin scroll en mobile:
 *   - Logo grande centrado
 *   - Tagline 1 línea
 *   - CTA único "Continuar con Google"
 *   - Footer con links legales
 * Magic-link disponible vía /login como fallback, no visible acá.
 */
export function LandingMinimal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearError, errorMessage, isConfigured, profile, signInWithGoogle, status } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(searchParams.get("next"), profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, searchParams, status]);

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      await signInWithGoogle();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No pudimos abrir Google Sign-In.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const message = errorMessage ?? localError;

  return (
    <main className="min-h-[100dvh] grid grid-rows-[1fr_auto] px-6">
      <div className="flex flex-col items-center justify-center gap-8 py-8 max-w-[420px] mx-auto w-full">
        <div className="grid gap-3 text-center">
          <h1 className="m-0 typo-h1 text-text-primary">Prode Mundial</h1>
          <p className="m-0 typo-body text-text-secondary">Predice rápido. Compite mejor.</p>
        </div>

        <div className="w-full grid gap-3">
          <Button onClick={handleGoogleLogin} disabled={!isConfigured || isSubmitting} fullWidth>
            {isSubmitting ? "Conectando..." : "Continuar con Google"}
          </Button>

          {!isConfigured ? (
            <div className="p-3 rounded-md alert-error text-[13px] leading-[1.4] text-center">
              Firebase no está configurado todavía en este entorno.
            </div>
          ) : null}

          {message ? (
            <div className="p-3 rounded-md alert-error text-[13px] leading-[1.4] text-center">
              {message}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex flex-wrap gap-3 justify-center py-6">
        {SUPPORT_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-text-muted font-semibold no-underline text-[13px]"
          >
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
