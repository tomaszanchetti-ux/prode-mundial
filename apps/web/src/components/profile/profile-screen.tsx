"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UpdateProfileInput, UserProfile } from "@prode/shared";
import { Card } from "@prode/ui";
import { webConfig } from "@/config/app";
import { getMyProfile, updateMyProfile } from "@/lib/api/client";

type FormState = {
  displayName: string;
  country: string;
};

function toFormState(profile: UserProfile): FormState {
  return {
    displayName: profile.displayName,
    country: profile.country ?? ""
  };
}

export function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState<FormState>({ displayName: "", country: "" });
  const [status, setStatus] = useState<string>("Cargando perfil...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMyProfile(webConfig.devSessionToken)
      .then((nextProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setFormState(toFormState(nextProfile));
        setStatus("Perfil listo.");
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }

        setStatus(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      const nextProfile = await updateMyProfile(webConfig.devSessionToken, input);
      setProfile(nextProfile);
      setFormState(toFormState(nextProfile));
      setStatus("Perfil actualizado.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>Perfil</h1>
        <p style={{ marginBottom: 8 }}>
          Slice temporal de Epic 1 con token de desarrollo mientras se conecta Firebase Auth real.
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
            <li>Total puntos: {profile.totalPoints}</li>
            <li>Puntos macro: {profile.macroPoints}</li>
            <li>Aciertos exactos: {profile.exactHits}</li>
            <li>Signos correctos: {profile.correctSigns}</li>
            <li>Ligas: {profile.leaguesCount}</li>
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
