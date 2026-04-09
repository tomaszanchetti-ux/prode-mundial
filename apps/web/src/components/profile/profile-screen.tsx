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
          {profile?.profileCompleted ? "Tu cuenta ya esta lista" : "Completa tu cuenta para empezar"}
        </h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary, maxWidth: 620 }}>
          Tu nombre visible es la forma en que apareces en ligas, posiciones y resultados. Ajustalo una vez y sigue con el juego.
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

      <section style={{ display: "grid", gap: spacing[16], gridTemplateColumns: "1fr 0.9fr" }}>
        <Card elevated style={{ gap: spacing[16], padding: spacing[20] }}>
          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>DATOS</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Tu identidad dentro del Prode</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
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
              <span style={{ ...typography.small, color: colors.textSecondary }}>Pais opcional</span>
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
              {isSaving ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </form>
        </Card>

        <div style={{ display: "grid", gap: spacing[16] }}>
          {profile ? (
            <Card elevated style={{ gap: spacing[12], padding: spacing[20] }}>
              <span style={{ ...typography.small, color: colors.textMuted }}>RESUMEN</span>
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600 }}>{profile.displayName}</p>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>{profile.email}</p>
              </div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div>
                  <span style={{ ...typography.small, color: colors.textMuted }}>PUNTOS</span>
                  <p style={{ margin: "6px 0 0", color: colors.textPrimary, fontSize: 24, fontWeight: 700 }}>{profile.totalPoints}</p>
                </div>
                <div>
                  <span style={{ ...typography.small, color: colors.textMuted }}>LIGAS</span>
                  <p style={{ margin: "6px 0 0", color: colors.textPrimary, fontSize: 24, fontWeight: 700 }}>{profile.leaguesCount}</p>
                </div>
                <div>
                  <span style={{ ...typography.small, color: colors.textMuted }}>EXACTOS</span>
                  <p style={{ margin: "6px 0 0", color: colors.textPrimary, fontSize: 24, fontWeight: 700 }}>{profile.exactHits}</p>
                </div>
                <div>
                  <span style={{ ...typography.small, color: colors.textMuted }}>SIGNOS</span>
                  <p style={{ margin: "6px 0 0", color: colors.textPrimary, fontSize: 24, fontWeight: 700 }}>{profile.correctSigns}</p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card elevated style={{ gap: spacing[12], padding: spacing[20] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>CUENTA</span>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Si cambias de dispositivo o vuelves mas tarde, tu sesion y tu perfil siguen listos para retomar rapido.
            </p>
            <Button variant="secondary" onClick={handleLogout}>
              Cerrar sesion
            </Button>
          </Card>
        </div>
      </section>

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
