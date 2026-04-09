"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_ROUTES, SUPPORT_LINKS } from "@prode/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@prode/ui";
import { useAuth } from "./auth-provider";

function resolveNextRoute(next: string | null, profileCompleted: boolean | undefined) {
  if (profileCompleted === false) {
    return APP_ROUTES.profile;
  }

  return next && next.startsWith("/") ? next : APP_ROUTES.home;
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

  const helperMessage = errorMessage ?? localMessage;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px 56px", display: "grid", gap: 16 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Entrar para jugar</h1>
        <p style={{ marginBottom: 12 }}>
          Inicia con Google o recibe un magic link para entrar directo al área autenticada del MVP.
        </p>

        {!isConfigured ? (
          <p style={{ margin: 0, color: "#8a1c1c" }}>
            Firebase no está configurado todavía en este entorno. Completa las variables `NEXT_PUBLIC_FIREBASE_*`.
          </p>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!isConfigured || isSubmitting}
            style={{ padding: "14px 16px", borderRadius: 999, border: 0, background: "#102a13", color: "#f6f5ef" }}
          >
            {isSubmitting ? "Conectando..." : "Continuar con Google"}
          </button>

          <form onSubmit={handleSendMagicLink} style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              required
              style={{ padding: 12, borderRadius: 12, border: "1px solid #c9cfbf" }}
            />
            <button
              type="submit"
              disabled={!isConfigured || isSubmitting}
              style={{ padding: "14px 16px", borderRadius: 999, border: "1px solid #c9cfbf", background: "#fffdf7" }}
            >
              {isSubmitting ? "Enviando..." : "Enviar magic link"}
            </button>
          </form>

          {isEmailLink ? (
            <button
              type="button"
              onClick={handleCompleteMagicLink}
              disabled={!isConfigured || isSubmitting}
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px dashed #335c3d",
                background: "#eef5e6",
                color: "#102a13",
                fontWeight: 700
              }}
            >
              Completar ingreso con este magic link
            </button>
          ) : null}
        </div>

        {helperMessage ? <p style={{ marginBottom: 0, color: helperMessage.includes("Te enviamos") ? "#335c3d" : "#8a1c1c" }}>{helperMessage}</p> : null}
      </Card>

      <Card>
        <p style={{ marginTop: 0, marginBottom: 8 }}>Tu sesión se persiste al refrescar y el backend valida el bearer token Firebase.</p>
        <p style={{ margin: 0, color: "#5f6657" }}>Si tu perfil sigue incompleto después del login, te llevamos directo a `/profile`.</p>
      </Card>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: "#335c3d", fontWeight: 600 }}>
            {link.label}
          </Link>
        ))}
      </footer>
    </main>
  );
}
