"use client";

import React from "react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_ROUTES, SUPPORT_LINKS } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, colors, radii, spacing, typography } from "@prode/ui";
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
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 56px", display: "grid", gap: spacing[16] }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing[12] }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 20, lineHeight: 1, color: colors.textPrimary, letterSpacing: "-0.02em" }}>Prode Mundial</strong>
          <span style={{ ...typography.small, color: colors.textMuted }}>Vuelve rapido al proximo partido</span>
        </div>
        <Link href="/" style={{ color: colors.textSecondary, textDecoration: "none", fontWeight: 600 }}>
          Volver
        </Link>
      </header>

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card
          elevated
          style={{
            gap: spacing[16],
            padding: spacing[24],
            background:
              "radial-gradient(circle at top right, rgba(47, 107, 255, 0.18), transparent 30%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(7, 17, 31, 0.98) 100%)"
          }}
        >
          <span style={{ ...typography.small, color: colors.primary500 }}>ENTRA Y JUEGA</span>
          <div style={{ display: "grid", gap: spacing[12] }}>
            <h1 style={{ ...typography.h1, margin: 0, color: colors.textPrimary }}>Tu proximo partido te esta esperando</h1>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 520 }}>
              Entra con Google o por magic link, guarda tu prediccion en segundos y vuelve a seguir tus puntos y tus ligas.
            </p>
          </div>

          <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
            <div
              style={{
                padding: spacing[16],
                borderRadius: radii.lg,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>1</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 600 }}>Entras</p>
              <p style={{ margin: "6px 0 0", color: colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>Con Google o desde tu email.</p>
            </div>
            <div
              style={{
                padding: spacing[16],
                borderRadius: radii.lg,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>2</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 600 }}>Predices</p>
              <p style={{ margin: "6px 0 0", color: colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>Siempre hasta el kickoff exacto.</p>
            </div>
            <div
              style={{
                padding: spacing[16],
                borderRadius: radii.lg,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${colors.border}`
              }}
            >
              <span style={{ ...typography.small, color: colors.textMuted }}>3</span>
              <p style={{ margin: "8px 0 0", color: colors.textPrimary, fontWeight: 600 }}>Compites</p>
              <p style={{ margin: "6px 0 0", color: colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>Tus ligas concentran toda la tension.</p>
            </div>
          </div>
        </Card>

        <Card elevated style={{ gap: spacing[16], padding: spacing[24] }}>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>ACCESO</span>
            <h2 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Entra para seguir jugando</h2>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Elige la forma mas rapida para volver a tu home de partidos y ligas.
            </p>
          </div>

          {!isConfigured ? (
            <div
              style={{
                padding: spacing[16],
                borderRadius: radii.md,
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.18)",
                color: "#F5B4B4",
                fontSize: 14,
                lineHeight: 1.45
              }}
            >
              Firebase no está configurado todavía en este entorno. Completa las variables `NEXT_PUBLIC_FIREBASE_*`.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: spacing[12] }}>
            <Button onClick={onGoogleLogin} disabled={!isConfigured || isSubmitting}>
              {isSubmitting ? "Conectando..." : "Continuar con Google"}
            </Button>

            <form onSubmit={onSendMagicLink} style={{ display: "grid", gap: spacing[12] }}>
              <label style={{ display: "grid", gap: spacing[8] }}>
                <span style={{ ...typography.small, color: colors.textSecondary }}>Tu email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={{
                    minHeight: 52,
                    borderRadius: radii.md,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgMuted,
                    color: colors.textPrimary,
                    padding: "0 14px",
                    fontSize: 16,
                    outline: "none"
                  }}
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
            <div
              style={{
                padding: 14,
                borderRadius: radii.md,
                background: helperTone === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(220, 38, 38, 0.08)",
                border:
                  helperTone === "success" ? "1px solid rgba(34, 197, 94, 0.18)" : "1px solid rgba(220, 38, 38, 0.18)",
                color: helperTone === "success" ? "#9BE5B6" : "#F5B4B4",
                fontSize: 14,
                lineHeight: 1.45
              }}
            >
              {helperMessage}
            </div>
          ) : null}
        </Card>
      </section>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: colors.textSecondary, fontWeight: 600, textDecoration: "none" }}>
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
