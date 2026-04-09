"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput } from "@prode/shared";
import { SUPPORT_LINKS } from "@prode/shared";
import Link from "next/link";
import { Card } from "@prode/ui";
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
        throw new Error("No encontramos una sesión activa.");
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
    setStatus("Cerrando sesión...");

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo cerrar la sesión.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Perfil</h1>
        <p style={{ marginBottom: 8 }}>
          Completa tu nombre visible y deja lista tu cuenta para entrar al loop autenticado del Prode.
        </p>
        <p style={{ margin: 0, color: "#5f6657" }}>{status}</p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nombre visible</span>
            <input
              name="displayName"
              value={formState.displayName}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
              required
              style={{ padding: 12, borderRadius: 12, border: "1px solid #c9cfbf" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>País opcional</span>
            <input
              name="country"
              value={formState.country}
              onChange={handleChange}
              maxLength={2}
              placeholder="ES"
              style={{ padding: 12, borderRadius: 12, border: "1px solid #c9cfbf" }}
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: "12px 16px",
              borderRadius: 999,
              border: 0,
              background: "#102a13",
              color: "#f6f5ef",
              fontWeight: 700
            }}
          >
            {isSaving ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </Card>

      {profile ? (
        <Card>
          <h2 style={{ marginTop: 0 }}>Resumen actual</h2>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>Email: {profile.email}</li>
            <li>Foto: {profile.photoUrl ? "Importada desde tu proveedor auth" : "Sin foto todavía"}</li>
            <li>Total puntos: {profile.totalPoints}</li>
            <li>Puntos macro: {profile.macroPoints}</li>
            <li>Aciertos exactos: {profile.exactHits}</li>
            <li>Signos correctos: {profile.correctSigns}</li>
            <li>Ligas: {profile.leaguesCount}</li>
          </ul>
        </Card>
      ) : null}

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: "#335c3d", fontWeight: 600 }}>
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "12px 16px",
            borderRadius: 999,
            border: "1px solid #c9cfbf",
            background: "#fffdf7",
            color: "#102a13",
            fontWeight: 700
          }}
        >
          Cerrar sesión
        </button>
      </Card>
    </div>
  );
}
