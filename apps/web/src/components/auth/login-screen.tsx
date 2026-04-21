"use client";

import React from "react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_ROUTES, SUPPORT_LINKS } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@prode/ui";
import { useAuth } from "./auth-provider";

export function resolveNextRoute(next: string | null, profileCompleted: boolean | undefined) {
  if (profileCompleted === false) {
    return APP_ROUTES.profile;
  }

  return next && next.startsWith("/") ? next : APP_ROUTES.home;
}

type LoginScreenViewProps = {
  email: string;
  helperMessage: string | null;
  isConfigured: boolean;
  isEmailLink: boolean;
  isSubmitting: boolean;
  onCompleteMagicLink: () => void;
  onEmailChange: (value: string) => void;
  onGoogleLogin: () => void;
  onSendMagicLink: (event: FormEvent<HTMLFormElement>) => void;
};

export function resolveHelperTone(errorMessage: string | null, localMessage: string | null) {
  if (errorMessage) {
    return "error";
  }

  if (localMessage?.includes("Te enviamos")) {
    return "success";
  }

  return localMessage ? "error" : null;
}

export function LoginScreenView({
  email,
  helperMessage,
  isConfigured,
  isEmailLink,
  isSubmitting,
  onCompleteMagicLink,
  onEmailChange,
  onGoogleLogin,
  onSendMagicLink
}: LoginScreenViewProps) {
  const helperTone = resolveHelperTone(helperMessage && !helperMessage.includes("Te enviamos") ? helperMessage : null, helperMessage);

  return (
    <main className="max-w-[1080px] mx-auto px-4 pt-6 pb-14 grid gap-4">
      <header className="flex justify-between items-center gap-3">
        <div className="grid gap-1">
          <strong className="text-[20px] leading-none text-text-primary tracking-[-0.02em]">Prode Mundial</strong>
          <span className="typo-small text-text-muted">Vuelve rapido al proximo partido</span>
        </div>
        <Link href="/" className="text-text-secondary no-underline font-semibold">
          Volver
        </Link>
      </header>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
        <Card elevated className="login-hero-bg" style={{ gap: 16, padding: 24 }}>
          <span className="typo-small text-primary-500">ENTRA Y JUEGA</span>
          <div className="grid gap-3">
            <h1 className="typo-h1 m-0 text-text-primary">Tu proximo partido te esta esperando</h1>
            <p className="typo-body m-0 text-text-secondary max-w-[520px]">
              Entra con Google o por magic link, guarda tu prediccion en segundos y vuelve a seguir tus puntos y tus ligas.
            </p>
          </div>

          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
            <div className="p-4 rounded-lg step-card">
              <span className="typo-small text-text-muted">1</span>
              <p className="mt-2 mb-0 text-text-primary font-semibold">Entras</p>
              <p className="mt-[6px] mb-0 text-text-secondary text-[14px] leading-[1.4]">Con Google o desde tu email.</p>
            </div>
            <div className="p-4 rounded-lg step-card">
              <span className="typo-small text-text-muted">2</span>
              <p className="mt-2 mb-0 text-text-primary font-semibold">Predices</p>
              <p className="mt-[6px] mb-0 text-text-secondary text-[14px] leading-[1.4]">Siempre hasta el kickoff exacto.</p>
            </div>
            <div className="p-4 rounded-lg step-card">
              <span className="typo-small text-text-muted">3</span>
              <p className="mt-2 mb-0 text-text-primary font-semibold">Compites</p>
              <p className="mt-[6px] mb-0 text-text-secondary text-[14px] leading-[1.4]">Tus ligas concentran toda la tension.</p>
            </div>
          </div>
        </Card>

        <Card elevated style={{ gap: 16, padding: 24 }}>
          <div className="grid gap-2">
            <span className="typo-eyebrow">ACCESO</span>
            <h2 className="typo-h2 m-0 text-text-primary">Entra para seguir jugando</h2>
            <p className="typo-body m-0 text-text-secondary">
              Elige la forma mas rapida para volver a tu home de partidos y ligas.
            </p>
          </div>

          {!isConfigured ? (
            <div className="p-4 rounded-md alert-error text-[14px] leading-[1.45]">
              Firebase no está configurado todavía en este entorno. Completa las variables `NEXT_PUBLIC_FIREBASE_*`.
            </div>
          ) : null}

          <div className="grid gap-3">
            <Button onClick={onGoogleLogin} disabled={!isConfigured || isSubmitting}>
              {isSubmitting ? "Conectando..." : "Continuar con Google"}
            </Button>

            <form onSubmit={onSendMagicLink} className="grid gap-3">
              <label className="grid gap-2">
                <span className="typo-small text-text-secondary">Tu email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="email-input"
                />
              </label>
              <Button type="submit" variant="secondary" disabled={!isConfigured || isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar magic link"}
              </Button>
            </form>

            {isEmailLink ? (
              <Button variant="ghost" onClick={onCompleteMagicLink} disabled={!isConfigured || isSubmitting}>
                Completar ingreso con este magic link
              </Button>
            ) : null}
          </div>

          {helperMessage ? (
            <div className={`p-3.5 rounded-md text-[14px] leading-[1.45] ${helperTone === "success" ? "alert-success" : "alert-error"}`}>
              {helperMessage}
            </div>
          ) : null}
        </Card>
      </section>

      <footer className="flex flex-wrap gap-3">
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-text-secondary font-semibold no-underline">
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearError, completeMagicLink, errorMessage, isConfigured, isEmailLink, profile, sendMagicLink, signInWithGoogle, status } =
    useAuth();
  const [email, setEmail] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(resolveNextRoute(searchParams.get("next"), profile?.profileCompleted));
    }
  }, [profile?.profileCompleted, router, searchParams, status]);

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setLocalMessage(null);
    clearError();

    try {
      await signInWithGoogle();
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "No pudimos abrir Google Sign-In.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalMessage(null);
    clearError();

    try {
      await sendMagicLink(email.trim());
      setLocalMessage("Te enviamos un magic link. Revisa tu email y vuelve desde ese link.");
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "No pudimos enviar el magic link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteMagicLink() {
    setIsSubmitting(true);
    setLocalMessage(null);
    clearError();

    try {
      await completeMagicLink(email);
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "No pudimos completar el ingreso por email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LoginScreenView
      email={email}
      helperMessage={errorMessage ?? localMessage}
      isConfigured={isConfigured}
      isEmailLink={isEmailLink}
      isSubmitting={isSubmitting}
      onCompleteMagicLink={handleCompleteMagicLink}
      onEmailChange={setEmail}
      onGoogleLogin={handleGoogleLogin}
      onSendMagicLink={handleSendMagicLink}
    />
  );
}
