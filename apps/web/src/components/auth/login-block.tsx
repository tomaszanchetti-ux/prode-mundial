"use client";

import React, { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@prode/ui";
import { useAuth } from "./auth-provider";

type LoginBlockProps = {
  onCompleted?: () => void;
};

export function LoginBlock({ onCompleted }: LoginBlockProps) {
  const {
    clearError,
    completeMagicLink,
    errorMessage,
    isConfigured,
    isEmailLink,
    sendMagicLink,
    signInWithGoogle
  } = useAuth();
  const [email, setEmail] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setLocalMessage(null);
    clearError();

    try {
      await signInWithGoogle();
      onCompleted?.();
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
      setLocalMessage("Te enviamos un link. Revisá tu email.");
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "No pudimos enviar el link.");
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
      onCompleted?.();
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : "No pudimos completar el ingreso.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const helperMessage = errorMessage ?? localMessage;
  const isSuccess = helperMessage?.includes("Te enviamos") ?? false;

  return (
    <div className="w-full grid gap-3">
      <Button
        onClick={handleGoogleLogin}
        disabled={!isConfigured || isSubmitting}
        fullWidth
        className="landing-btn-google"
      >
        {isSubmitting ? "Conectando..." : "Continuar con Google"}
      </Button>

      <div className="landing-divider">
        <span>o</span>
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
          {isSubmitting ? "Enviando..." : "Enviar link"}
        </Button>
      </form>

      {isEmailLink ? (
        <Button
          variant="ghost"
          onClick={handleCompleteMagicLink}
          disabled={!isConfigured || isSubmitting}
          fullWidth
          className="landing-btn-ghost"
        >
          Completar ingreso con este link
        </Button>
      ) : null}

      {!isConfigured ? (
        <div className="landing-alert landing-alert-error" role="status">
          Firebase no está configurado en este entorno.
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
