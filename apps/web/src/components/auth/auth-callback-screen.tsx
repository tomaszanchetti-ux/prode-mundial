"use client";

import React, { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { Button } from "@prode/ui";
import { APP_ROUTES } from "@prode/shared";
import { firebaseAuth } from "@/lib/firebase/client";
import { resolveNextRoute } from "./login-screen";
import { readStoredMagicLinkEmail, useAuth } from "./auth-provider";

type CallbackState =
  | { kind: "ready"; email: string }
  | { kind: "ask-email" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "invalid-link" };

// Anti-scanner pattern (replica de Enterprise WS16/WS17):
// `signInWithEmailLink` SOLO se dispara on-click humano. NO en page-load,
// NO en useEffect. Eso evita que los pre-fetchers de Gmail/Outlook consuman
// el oobCode antes que el user real.
export function AuthCallbackScreen() {
  const router = useRouter();
  const { status, profile, completeMagicLink, clearError } = useAuth();
  const [state, setState] = useState<CallbackState>(() => {
    // Inicialización lazy SOLO para resolver UI inicial. NO consume el oobCode.
    if (typeof window === "undefined" || !firebaseAuth) {
      return { kind: "ask-email" };
    }
    if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      return { kind: "invalid-link" };
    }
    const stored = readStoredMagicLinkEmail();
    return stored ? { kind: "ready", email: stored } : { kind: "ask-email" };
  });
  const [emailInput, setEmailInput] = useState("");

  // Si el user ya está autenticado (caso: completó el link, o ya tenía sesión),
  // redirigir al home (o a profile si está incompleto).
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(null, profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, status]);

  async function handleConfirm(emailOverride?: string) {
    const email = (emailOverride ?? (state.kind === "ready" ? state.email : "")).trim();
    setState({ kind: "submitting" });
    clearError();

    try {
      await completeMagicLink(email);
      // No redirigimos acá — el efecto de arriba escucha `status === "authenticated"`
      // y dispara el redirect cuando `onAuthStateChanged` propaga el cambio.
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No pudimos completar el ingreso por email.";
      setState({ kind: "error", message });
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) {
      return;
    }
    await handleConfirm(trimmed);
  }

  return (
    <main className="landing-bg-dark min-h-[100dvh] grid place-items-center px-6">
      <div className="w-full max-w-[420px] grid gap-8 text-center">
        <div className="grid gap-3">
          <h1 className="landing-title">Confirmá tu ingreso.</h1>
          <p className="landing-subtitle">
            Hacé click para entrar a tu Mundial.
          </p>
        </div>

        {state.kind === "invalid-link" ? (
          <div className="grid gap-4">
            <div className="landing-alert landing-alert-error" role="status">
              Este link no es válido o ya expiró. Pedí uno nuevo desde el login.
            </div>
            <Link href={APP_ROUTES.login} className="block">
              <Button variant="secondary" fullWidth className="landing-btn-magic">
                Volver al login
              </Button>
            </Link>
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <div className="grid gap-3">
            <Button
              onClick={() => handleConfirm()}
              fullWidth
              className="landing-btn-magic"
              aria-label={`Ingresar como ${state.email}`}
            >
              Ingresá aquí
            </Button>
            <p className="text-white/56 text-[13px] leading-[1.45]">
              Vas a entrar como <span className="text-white/82">{state.email}</span>
            </p>
          </div>
        ) : null}

        {state.kind === "ask-email" ? (
          <form onSubmit={handleEmailSubmit} className="grid gap-3">
            <p className="text-white/72 text-[14px] leading-[1.5]">
              Confirmá el email donde recibiste el link para continuar.
            </p>
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
              className="landing-input-dark"
              aria-label="Email"
            />
            <Button type="submit" fullWidth className="landing-btn-magic">
              Ingresá aquí
            </Button>
          </form>
        ) : null}

        {state.kind === "submitting" ? (
          <div className="grid gap-3">
            <Button disabled fullWidth className="landing-btn-magic">
              Ingresando...
            </Button>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="grid gap-3">
            <div className="landing-alert landing-alert-error" role="status">
              {state.message}
            </div>
            <Link href={APP_ROUTES.login} className="block">
              <Button variant="secondary" fullWidth className="landing-btn-magic">
                Volver a empezar
              </Button>
            </Link>
          </div>
        ) : null}

        <p className="text-white/40 text-[12px] leading-[1.45]">
          Si el enlace expiró, volvé al{" "}
          <Link href={APP_ROUTES.login} className="text-white/72 underline-offset-2 underline">
            login
          </Link>{" "}
          y pedí uno nuevo.
        </p>
      </div>
    </main>
  );
}
