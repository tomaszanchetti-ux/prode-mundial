"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import { SUPPORT_LINKS } from "@prode/shared";
import Link from "next/link";
import { Button, Card } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { updateMyProfile } from "@/lib/api/client";

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
  const [status, setStatus] = useState<string>("Preparando tu perfil...");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { logout, profile, refreshProfile, user } = useAuth();

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState(toFormState(profile.displayName, profile.country));
    setStatus(profile.profileCompleted ? "Perfil listo para competir." : "Completa tu perfil para entrar a jugar.");
  }, [profile]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("Guardando tu identidad...");

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
      setStatus("Perfil actualizado.");
      if (nextProfile.profileCompleted) {
        router.replace("/home");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    setStatus("Cerrando sesion...");

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo cerrar la sesion.");
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
      <Card elevated className="league-action-bg" style={{ gap: 12, padding: 24 }}>
        <span className="typo-small text-primary-500">PERFIL</span>
        <h1 className="typo-h2 m-0 text-text-primary">
          {profile?.profileCompleted ? "Tu perfil" : "Completa tu perfil"}
        </h1>
        <p className="typo-body m-0 text-text-secondary max-w-[620px]">
          Ajusta tu nombre visible y tu pais para que tu identidad se lea bien en ligas, posiciones y resultados.
        </p>
        <div className="p-[14px] rounded-md bg-[rgba(255,255,255,0.04)] border border-border-default text-text-secondary text-[14px] leading-[1.45]">
          {status}
        </div>
      </Card>

      {profile ? (
        <Card elevated style={{ gap: 12, padding: 20 }}>
          <span className="typo-small text-text-muted">IDENTIDAD</span>
          <div className="grid gap-1.5">
            <strong className="text-[20px] leading-[1.2] text-text-primary">{profile.displayName}</strong>
            <span className="text-[14px] leading-[1.4] text-text-secondary">{profile.email}</span>
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: 16, padding: 20 }}>
        <div className="grid gap-2">
          <span className="typo-small text-text-muted">TUS DATOS</span>
          <h2 className="typo-h3 m-0 text-text-primary">Como te ve el resto</h2>
        </div>

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
            <span className="typo-small text-text-secondary">Pais</span>
            <input
              name="country"
              value={formState.country}
              onChange={handleChange}
              maxLength={2}
              placeholder="ES"
              className="email-input uppercase"
            />
          </label>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Card>

      {profile ? (
        <Card elevated style={{ gap: 12, padding: 20 }}>
          <span className="typo-small text-text-muted">TU RESUMEN</span>
          <div className="grid gap-3 grid-cols-2">
            {profileStats.map((item) => (
              <div
                key={item.label}
                className="grid gap-1 p-3 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-border-default"
              >
                <span className="typo-small text-text-muted">{item.label.toUpperCase()}</span>
                <span className="text-[24px] leading-none text-text-primary font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: 12, padding: 20 }}>
        <span className="typo-small text-text-muted">CUENTA</span>
        <p className="typo-body m-0 text-text-secondary">
          Si vuelves mas tarde o cambias de dispositivo, tu perfil queda listo para retomar rapido.
        </p>
        <Button variant="secondary" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </Card>

      <Card style={{ gap: 12, padding: 16 }}>
        <div className="flex flex-wrap gap-3">
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-text-secondary font-semibold no-underline">
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
