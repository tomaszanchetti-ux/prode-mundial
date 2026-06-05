"use client";

import React, { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { Button } from "@prode/ui";
import { APP_ROUTES } from "@prode/shared";
import { firebaseAuth } from "@/lib/firebase/client";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { resolveNextRoute } from "./login-screen";
import { readStoredMagicLinkEmail, useAuth } from "./auth-provider";

type CallbackState =
  | { kind: "loading" }
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
  const { status, profile, errorMessage, completeMagicLink, clearError } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  // Estado inicial neutro para evitar hydration mismatch — `window` y
  // `localStorage` solo existen en client. Resolvemos el estado real en el
  // useEffect que sigue.
  const [state, setState] = useState<CallbackState>({ kind: "loading" });
  const [emailInput, setEmailInput] = useState("");
  const submittedRef = useRef(false);

  // Resolución del estado inicial post-hydration (client-only).
  useEffect(() => {
    if (typeof window === "undefined" || !firebaseAuth) {
      setState({ kind: "ask-email" });
      return;
    }
    if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      setState({ kind: "invalid-link" });
      return;
    }
    const stored = readStoredMagicLinkEmail();
    setState(stored ? { kind: "ready", email: stored } : { kind: "ask-email" });
  }, []);

  // Si el user ya está autenticado (caso: completó el link, o ya tenía sesión),
  // redirigir al home (o a profile si está incompleto).
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(null, profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, status]);

  // Si post-submit el provider entra en "error" o vuelve a "unauthenticated"
  // (ej: signInWithEmailLink OK pero `getMyProfile` falló), reflejarlo en la
  // UI en vez de quedar pegados en "Ingresando...".
  useEffect(() => {
    if (!submittedRef.current) {
      return;
    }
    if (status === "error") {
      setState({
        kind: "error",
        message: errorMessage ?? t("No pudimos completar el ingreso. Intentalo de nuevo.", "We couldn't complete your sign-in. Try again.")
      });
      submittedRef.current = false;
    } else if (status === "unauthenticated") {
      setState({
        kind: "error",
        message: errorMessage ?? t("El link expiró o ya fue usado. Pedí uno nuevo.", "The link expired or was already used. Request a new one.")
      });
      submittedRef.current = false;
    } else if (status === "authenticated") {
      submittedRef.current = false;
    }
  }, [errorMessage, status]);

  async function handleConfirm(emailOverride?: string) {
    const email = (emailOverride ?? (state.kind === "ready" ? state.email : "")).trim();
    setState({ kind: "submitting" });
    submittedRef.current = true;
    clearError();

    try {
      await completeMagicLink(email);
      // No redirigimos acá — el efecto de arriba escucha `status === "authenticated"`
      // y dispara el redirect cuando `onAuthStateChanged` propaga el cambio.
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t("No pudimos completar el ingreso por email.", "We couldn't complete your email sign-in.");
      setState({ kind: "error", message });
      submittedRef.current = false;
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
          <h1 className="landing-title">{t("Confirmá tu ingreso.", "Confirm your sign-in.")}</h1>
          <p className="landing-subtitle">
            {t("Hacé click para entrar a tu Mundial.", "Click to enter your World Cup.")}
          </p>
        </div>

        {state.kind === "loading" ? (
          <div className="grid gap-3">
            <Button disabled fullWidth className="landing-btn-magic">
              {t("Verificando link...", "Verifying link...")}
            </Button>
          </div>
        ) : null}

        {state.kind === "invalid-link" ? (
          <div className="grid gap-4">
            <div className="landing-alert landing-alert-error" role="status">
              {t("Este link no es válido o ya expiró. Pedí uno nuevo desde el login.", "This link is invalid or has expired. Request a new one from the login.")}
            </div>
            <Link href={APP_ROUTES.login} className="block">
              <Button variant="secondary" fullWidth className="landing-btn-magic">
                {t("Volver al login", "Back to login")}
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
              aria-label={t(`Ingresar como ${state.email}`, `Sign in as ${state.email}`)}
            >
              {t("Ingresá aquí", "Sign in here")}
            </Button>
            <p className="text-white/56 text-[13px] leading-[1.45]">
              {t("Vas a entrar como", "You'll sign in as")} <span className="text-white/82">{state.email}</span>
            </p>
          </div>
        ) : null}

        {state.kind === "ask-email" ? (
          <form onSubmit={handleEmailSubmit} className="grid gap-3">
            <p className="text-white/72 text-[14px] leading-[1.5]">
              {t("Confirmá el email donde recibiste el link para continuar.", "Confirm the email where you received the link to continue.")}
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
              {t("Ingresá aquí", "Sign in here")}
            </Button>
          </form>
        ) : null}

        {state.kind === "submitting" ? (
          <div className="grid gap-3">
            <Button disabled fullWidth className="landing-btn-magic">
              {t("Ingresando...", "Signing in...")}
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
                {t("Volver a empezar", "Start over")}
              </Button>
            </Link>
          </div>
        ) : null}

        <p className="text-white/40 text-[12px] leading-[1.45]">
          {t("Si el enlace expiró, volvé al", "If the link expired, go back to the")}{" "}
          <Link href={APP_ROUTES.login} className="text-white/72 underline-offset-2 underline">
            {t("login", "login")}
          </Link>{" "}
          {t("y pedí uno nuevo.", "and request a new one.")}
        </p>
      </div>
    </main>
  );
}
