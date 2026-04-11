"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import { SUPPORT_LINKS } from "@prode/shared";
import Link from "next/link";
import { Button, Card, colors, radii, spacing, typography } from "@prode/ui";
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
  const [status, setStatus] = useState<string>("Cargando perfil...");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { logout, profile, refreshProfile, user } = useAuth();

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState(toFormState(profile.displayName, profile.country));
    setStatus(profile.profileCompleted ? "Perfil listo." : "Completa tu perfil para entrar al resto de la app.");
  }, [profile]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("Guardando cambios...");

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
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card
        elevated
        style={{
          gap: spacing[12],
          padding: spacing[24],
          background:
            "radial-gradient(circle at top right, rgba(47, 107, 255, 0.16), transparent 28%), linear-gradient(180deg, rgba(16, 29, 49, 0.98) 0%, rgba(10, 21, 35, 0.98) 100%)"
        }}
      >
        <span style={{ ...typography.small, color: colors.primary500 }}>PERFIL</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>
          {profile?.profileCompleted ? "Tu perfil" : "Completa tu perfil"}
        </h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 620 }}>
          Ajusta tu nombre visible y tu pais para que tu identidad se vea bien en ligas, posiciones y resultados.
        </p>
        <div
          style={{
            padding: 14,
            borderRadius: radii.md,
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 1.45
          }}
        >
          {status}
        </div>
      </Card>

      {profile ? (
        <Card elevated style={{ gap: spacing[12], padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>IDENTIDAD</span>
          <div style={{ display: "grid", gap: 6 }}>
            <strong style={{ fontSize: 20, lineHeight: 1.2, color: colors.textPrimary }}>{profile.displayName}</strong>
            <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>{profile.email}</span>
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: spacing[16], padding: spacing[20] }}>
        <div style={{ display: "grid", gap: spacing[8] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>TUS DATOS</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Como te ve el resto</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing[16] }}>
          <label style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textSecondary }}>Nombre visible</span>
            <input
              name="displayName"
              value={formState.displayName}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
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

          <label style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textSecondary }}>Pais</span>
            <input
              name="country"
              value={formState.country}
              onChange={handleChange}
              maxLength={2}
              placeholder="ES"
              style={{
                minHeight: 52,
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                background: colors.bgMuted,
                color: colors.textPrimary,
                padding: "0 14px",
                fontSize: 16,
                outline: "none",
                textTransform: "uppercase"
              }}
            />
          </label>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Card>

      {profile ? (
        <Card elevated style={{ gap: spacing[12], padding: spacing[20] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>TU RESUMEN</span>
          <div style={{ display: "grid", gap: spacing[12], gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            {profileStats.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gap: 4,
                  padding: spacing[12],
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${colors.border}`
                }}
              >
                <span style={{ ...typography.small, color: colors.textMuted }}>{item.label.toUpperCase()}</span>
                <span style={{ fontSize: 24, lineHeight: 1, color: colors.textPrimary, fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: spacing[12], padding: spacing[20] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>CUENTA</span>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Si vuelves mas tarde o cambias de dispositivo, tu sesion y tu perfil quedan listos para retomar rapido.
        </p>
        <Button variant="secondary" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </Card>

      <Card style={{ gap: spacing[12], padding: spacing[16] }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: colors.textSecondary, fontWeight: 600, textDecoration: "none" }}>
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
