"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import Link from "next/link";
import { Button, Card, ErrorCard } from "@prode/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, createBillingCheckout, updateMyProfile } from "@/lib/api/client";
import { PreferencesSection } from "@/components/profile/preferences-section";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { openConsentPreferences } from "@/lib/consent/consent-events";

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
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, profile, refreshProfile, user } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  const isGold = profile?.plan === "gold";

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState(toFormState(profile.displayName, profile.country));
  }, [profile]);

  useEffect(() => {
    const upgradeStatus = searchParams.get("upgrade");
    if (upgradeStatus === "cancelled") {
      setUpgradeNotice(
        t("Cancelaste el upgrade. Podés volver a intentarlo cuando quieras.", "You cancelled the upgrade. You can try again anytime.")
      );
    }
  }, [searchParams, t]);

  async function handleUpgradeClick() {
    if (!user || isUpgrading) {
      return;
    }
    setIsUpgrading(true);
    setUpgradeNotice(null);
    try {
      const token = await user.getIdToken();
      const { url } = await createBillingCheckout(token);
      window.location.href = url;
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "STRIPE_DISABLED") {
        setUpgradeNotice(
          t("El pago no está disponible todavía. Volvé en unas horas.", "Payments are not enabled yet. Please try again later.")
        );
      } else if (error instanceof ApiClientError && error.code === "STRIPE_ALREADY_GOLD") {
        setUpgradeNotice(t("Ya tenés el plan Gold activo.", "You already have Gold."));
        await refreshProfile();
      } else {
        setUpgradeNotice(
          error instanceof Error ? error.message : t("No pudimos iniciar el pago.", "Could not start checkout.")
        );
      }
      setIsUpgrading(false);
    }
  }

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

      <PreferencesSection user={user} />

      {/* ── Planes: Gold + Enterprise (CTAs a la landing) ── */}
      <Card id="planes" elevated className="gap-3 p-5">
        <div className="grid gap-1">
          <span className="typo-eyebrow text-primary-500">{t("PLANES", "PLANS")}</span>
          <h2 className="typo-h3 m-0 text-text-primary">
            {t("Gold y Enterprise", "Gold and Enterprise")}
          </h2>
        </div>

        {upgradeNotice ? (
          <div className="rounded-md border border-border-default bg-bg-interactive px-3 py-2 text-[13px] text-text-secondary">
            {upgradeNotice}
          </div>
        ) : null}

        <div className="plan-grid">
          {isGold ? (
            <div className="plan-card plan-card-gold" aria-label={t("Plan Gold activo", "Gold plan active")}>
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-[16px] text-text-primary">Gold</strong>
                <span className="plan-gold-badge">{t("ACTIVO ✓", "ACTIVE ✓")}</span>
              </div>
              <div className="grid gap-1">
                <span className="plan-feature">{t("Ligas ilimitadas", "Unlimited leagues")}</span>
                <span className="plan-feature">{t("20 jugadores por liga", "20 players per league")}</span>
                <span className="plan-feature">{t("Sin anuncios", "No ads")}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={isUpgrading}
              className="plan-card plan-card-gold text-left disabled:opacity-60 disabled:cursor-wait"
              aria-label={t("Hacerse Gold por $5", "Become Gold for $5")}
            >
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-[16px] text-text-primary">Gold</strong>
                <span className="plan-gold-badge">{isUpgrading ? t("Procesando…", "Processing…") : "$5"}</span>
              </div>
              <div className="grid gap-1">
                <span className="plan-feature">{t("Ligas ilimitadas", "Unlimited leagues")}</span>
                <span className="plan-feature">{t("20 jugadores por liga", "20 players per league")}</span>
                <span className="plan-feature">{t("Sin anuncios", "No ads")}</span>
              </div>
            </button>
          )}
          <a
            href="https://prodemundial.org"
            target="_blank"
            rel="noopener noreferrer"
            className="plan-card plan-card-enterprise"
            aria-label={t("Conocer plan Enterprise", "Learn about Enterprise plan")}
          >
            <div className="flex justify-between items-baseline gap-2">
              <strong className="text-[16px] text-text-primary">Enterprise</strong>
              <span className="plan-enterprise-badge">{t("Consultar", "Contact us")}</span>
            </div>
            <div className="grid gap-1">
              <span className="plan-feature">{t("Para empresas", "For companies")}</span>
              <span className="plan-feature">{t("+20 jugadores por liga", "20+ players per league")}</span>
              <span className="plan-feature">{t("Ligas y logos personalizados", "Custom leagues and logos")}</span>
            </div>
          </a>
        </div>
      </Card>

      {/* ── Recursos: Reglas · Términos y Privacidad · Cookies ── */}
      <Card elevated style={{ gap: 6, padding: 16 }}>
        <Link href="/rules" className="support-nav-card-row">
          <span>{t("Reglas", "Rules")}</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link href="/legal" className="support-nav-card-row">
          <span>{t("Términos y Privacidad", "Terms & Privacy")}</span>
          <span aria-hidden="true">›</span>
        </Link>
        <button
          type="button"
          onClick={openConsentPreferences}
          className="support-nav-card-row w-full text-left cursor-pointer"
        >
          <span>{t("Preferencias de cookies", "Cookie preferences")}</span>
          <span aria-hidden="true">›</span>
        </button>
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
