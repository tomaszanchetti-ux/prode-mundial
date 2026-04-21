"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import { SUPPORT_LINKS } from "@prode/shared";
import Link from "next/link";
import { Button, Card, ErrorCard } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { updateMyProfile } from "@/lib/api/client";
import { InstallAppCard } from "@/components/pwa/install-app-card";

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
  const router = useRouter();
  const { logout, profile, refreshProfile, user } = useAuth();

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

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cerrar la sesion.");
    }
  }

  const profileStats = profile
    ? [
        { label: "Puntos", value: String(profile.totalPoints) },
        { label: "Exactos", value: String(profile.exactHits) },
        { label: "Signos", value: String(profile.correctSigns) },
        { label: "Ligas", value: String(profile.leaguesCount) }
      ]
    : [];

  return (
    <div className="grid gap-4">
      {/* ── 1. Header + identidad ── */}
      <Card elevated className="league-action-bg" style={{ gap: 10, padding: 20 }}>
        <span className="typo-small text-primary-500">PERFIL</span>
        {profile ? (
          <div className="grid gap-1">
            <h1 className="typo-h2 m-0 text-text-primary">{profile.displayName}</h1>
            <span className="text-[14px] leading-[1.4] text-text-secondary">{profile.email}</span>
          </div>
        ) : (
          <h1 className="typo-h2 m-0 text-text-primary">Completa tu perfil</h1>
        )}
      </Card>

      {errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={() => setErrorMessage(null)} retryLabel="Cerrar" />
      ) : null}

      {/* ── 2. Form: nombre + país + guardar ── */}
      <Card elevated style={{ gap: 14, padding: 20 }}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="typo-small text-text-secondary">Nombre visible</span>
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
            <span className="typo-small text-text-secondary">Pais (codigo ISO)</span>
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
            Guardar cambios
          </Button>
        </form>
      </Card>

      {/* ── 3. Stats 2×2 ── */}
      {profile ? (
        <Card elevated style={{ gap: 10, padding: 20 }}>
          <span className="typo-small text-text-muted">TU RESUMEN</span>
          <div className="grid gap-2.5 grid-cols-2">
            {profileStats.map((item) => (
              <div key={item.label} className="grid gap-1 p-3 surface-inset">
                <span className="typo-small text-text-muted">{item.label.toUpperCase()}</span>
                <span className="text-[24px] leading-none text-text-primary font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <InstallAppCard />

      {/* ── 4. Cuenta + logout ── */}
      <Card elevated style={{ gap: 10, padding: 20 }}>
        <span className="typo-small text-text-muted">CUENTA</span>
        <Button variant="secondary" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </Card>

      <div className="flex flex-wrap gap-3 px-1">
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-text-secondary typo-small no-underline">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
