"use client";

import React, { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@prode/ui";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { useAuth } from "./auth-provider";

type LoginBlockProps = {
  onCompleted?: () => void;
};

export function LoginBlock({ onCompleted }: LoginBlockProps) {
  const {
    clearError,
    errorMessage,
    isConfigured,
    sendMagicLink,
    signInWithGoogle
  } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const [email, setEmail] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localTone, setLocalTone] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setLocalMessage(null);
    setLocalTone(null);
    clearError();

    try {
      await signInWithGoogle();
      onCompleted?.();
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : t("No pudimos abrir Google Sign-In.", "We couldn't open Google Sign-In."));
      setLocalTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalMessage(null);
    setLocalTone(null);
    clearError();

    try {
      await sendMagicLink(email.trim());
      setLocalMessage(t("Te enviamos un link. Revisá tu email.", "We sent you a link. Check your email."));
      setLocalTone("success");
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : t("No pudimos enviar el link.", "We couldn't send the link."));
      setLocalTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const helperMessage = errorMessage ?? localMessage;
  // errorMessage del provider siempre es error; localMessage trae su propio tono.
  const isSuccess = !errorMessage && localTone === "success";

  return (
    <div className="w-full grid gap-3">
      <Button
        onClick={handleGoogleLogin}
        disabled={!isConfigured || isSubmitting}
        fullWidth
        className="landing-btn-google"
      >
        {isSubmitting ? t("Conectando...", "Connecting...") : t("Continuar con Google", "Continue with Google")}
      </Button>

      <div className="landing-divider">
        <span>{t("o", "or")}</span>
      </div>

      <form onSubmit={handleSendMagicLink} className="grid gap-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          required
          className="landing-input-dark"
          aria-label="Email"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={!isConfigured || isSubmitting}
          fullWidth
          className="landing-btn-magic"
        >
          {isSubmitting ? t("Enviando...", "Sending...") : t("Enviar link", "Send link")}
        </Button>
      </form>

      {!isConfigured ? (
        <div className="landing-alert landing-alert-error" role="status">
          {t("Firebase no está configurado en este entorno.", "Firebase is not configured in this environment.")}
        </div>
      ) : null}

      {helperMessage ? (
        <div
          className={`landing-alert ${isSuccess ? "landing-alert-success" : "landing-alert-error"}`}
          role="status"
        >
          {helperMessage}
        </div>
      ) : null}
    </div>
  );
}
