"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import Link from "next/link";
import { Button, Card, ErrorCard } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { updateMyProfile } from "@/lib/api/client";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";

type FormState = {
  displayName: string;
  country: string;
};

function toFormState(displayName: string, country: string | null): FormState {
  return {
    displayName,
    country: country ?? ""
  };
}

export function ProfileScreen() {
  const [formState, setFormState] = useState<FormState>({ displayName: "", country: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { logout, profile, refreshProfile, user } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState(toFormState(profile.displayName, profile.country));
  }, [profile]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const input: UpdateProfileInput = {
      displayName: formState.displayName.trim(),
      country: formState.country.trim() ? formState.country.trim().toUpperCase() : null
    };

    try {
      if (!user) {
        throw new Error("No encontramos una sesion activa.");
      }

      const token = await user.getIdToken();
      const nextProfile = await updateMyProfile(token, input);
      setFormState(toFormState(nextProfile.displayName, nextProfile.country));
      await refreshProfile();
      if (nextProfile.profileCompleted) {
        router.replace("/home");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoutConfirmed() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cerrar la sesion.");
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* ── 1. Header + identidad ── */}
      <Card elevated className="league-action-bg" style={{ gap: 10, padding: 20 }}>
        <span className="typo-small text-primary-500">{t("PERFIL", "PROFILE")}</span>
        {profile ? (
          <div className="grid gap-1">
            <h1 className="typo-h2 m-0 text-text-primary">{profile.displayName}</h1>
            <span className="text-[14px] leading-[1.4] text-text-secondary">{profile.email}</span>
          </div>
        ) : (
          <h1 className="typo-h2 m-0 text-text-primary">{t("Completa tu perfil", "Complete your profile")}</h1>
        )}
      </Card>

      {errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={() => setErrorMessage(null)} retryLabel={t("Cerrar", "Close")} />
      ) : null}

      {/* ── 2. Form: nombre + país + guardar ── */}
      <Card elevated style={{ gap: 14, padding: 20 }}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="typo-small text-text-secondary">{t("Nombre visible", "Display name")}</span>
            <input
              name="displayName"
              value={formState.displayName}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
              required
              className="email-input"
            />
          </label>

          <label className="grid gap-2">
            <span className="typo-small text-text-secondary">{t("País (código ISO)", "Country (ISO code)")}</span>
            <input
              name="country"
              value={formState.country}
              onChange={handleChange}
              maxLength={2}
              placeholder="ES"
              className="email-input uppercase"
            />
          </label>

          <Button type="submit" loading={isSaving}>
            {t("Guardar", "Save")}
          </Button>
        </form>
      </Card>

      <InstallAppCard />

      {/* ── Recursos: Reglas · Términos y Privacidad ── */}
      <Card elevated style={{ gap: 6, padding: 16 }}>
        <Link href="/rules" className="support-nav-card-row">
          <span>{t("Reglas", "Rules")}</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link href="/legal" className="support-nav-card-row">
          <span>{t("Términos y Privacidad", "Terms & Privacy")}</span>
          <span aria-hidden="true">›</span>
        </Link>
      </Card>

      {/* ── Cuenta + logout (último) ── */}
      <Card elevated style={{ gap: 10, padding: 20 }}>
        <span className="typo-eyebrow">{t("CUENTA", "ACCOUNT")}</span>
        <Button variant="destructive" onClick={() => setShowLogoutConfirm(true)}>
          {t("Cerrar sesión", "Sign out")}
        </Button>
      </Card>

      {showLogoutConfirm ? (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirmed}
          isLoading={isLoggingOut}
          t={t}
        />
      ) : null}
    </div>
  );
}

function LogoutConfirmModal({
  onCancel,
  onConfirm,
  isLoading,
  t
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  t: (es: string, en: string) => string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] grid gap-4 p-5 rounded-[var(--radius-lg)] modal-content-bg modal-sheet-enter"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-1">
          <h2 id="logout-confirm-title" className="typo-h3 m-0 text-text-primary">
            {t("¿Cerrar sesión?", "Sign out?")}
          </h2>
          <p className="typo-body m-0 text-text-secondary">
            {t("Te vamos a sacar de la sesión actual. Podés volver cuando quieras.", "We'll end your current session. You can come back anytime.")}
          </p>
        </div>

        <div className="grid gap-2">
          <Button variant="destructive" onClick={onConfirm} loading={isLoading}>
            {t("Cerrar sesión", "Sign out")}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {t("Cancelar", "Cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
