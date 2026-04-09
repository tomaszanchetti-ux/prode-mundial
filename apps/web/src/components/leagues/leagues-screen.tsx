"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { LeagueSummary } from "@prode/shared";
import { Button, Card, StatusTag, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getMyLeagues } from "@/lib/api/client";

type LeaguesScreenViewProps = {
  items: LeagueSummary[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export function LeaguesScreenView({ items, isLoading, errorMessage, onRetry }: LeaguesScreenViewProps) {
  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>LIGAS</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tu espacio para competir con amigos</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Aquí ves tus ligas activas, tu posición actual y el acceso rápido para compartir o seguir el ranking.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>Cargando tus ligas...</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Todavía no tienes ligas</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Cuando creemos el flow de creación y join, esta vista va a pasar a ser tu hub social. Por ahora queda lista para consumir datos reales o demo.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage
        ? items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: spacing[12] }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{league.name}</h2>
                  <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                    {league.membersCount}/{league.memberLimit} jugadores
                  </p>
                </div>
                <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Inactiva"} />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: spacing[8],
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
                }}
              >
                <Metric label="Posición" value={league.position ? `#${league.position}` : "Sin tabla"} />
                <Metric label="Puntos" value={`${league.userPoints}`} />
                <Metric label="Código" value={league.inviteCode} />
              </div>

              <div
                style={{
                  padding: spacing[12],
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${colors.border}`
                }}
              >
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                  Invite link: {league.inviteLink ?? "Se compone desde la app cuando activemos el join público."}
                </p>
              </div>
            </Card>
          ))
        : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        padding: spacing[12],
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${colors.border}`
      }}
    >
      <span style={{ ...typography.small, color: colors.textMuted }}>{label}</span>
      <span style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{value}</span>
    </div>
  );
}

export function LeaguesScreen() {
  const { status, user } = useAuth();
  const [items, setItems] = useState<LeagueSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const response = await getMyLeagues(token);

        if (!cancelled) {
          setItems(response.items);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos cargar tus ligas.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  return <LeaguesScreenView items={items} isLoading={isLoading} errorMessage={errorMessage} onRetry={() => setReloadKey((value) => value + 1)} />;
}
