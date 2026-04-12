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
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tus ligas y tu lugar en cada una</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Aqui ves donde estas compitiendo ahora y como viene tu posicion sin adelantar todavia los flows reales de crear o unirse.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: spacing[8] }}>
          <div style={{ width: 96, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "100%", height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <span style={{ ...typography.small, color: colors.textMuted }}>SIN LIGAS TODAVIA</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Tu capa social se abre en Epic 4</h2>
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
            Cuando se habiliten crear liga, invitar y join real, esta vista pasa a ser tu hub social. Por ahora queda lista para leer competencia real o demo sin prometer flows que todavia no existen.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage
        ? items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: spacing[12] }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={{ ...typography.small, color: colors.textMuted }}>LIGA ACTIVA</span>
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
                <Metric label="Tu lugar" value={league.position ? `#${league.position}` : "Sin tabla"} />
                <Metric label="Tus puntos" value={`${league.userPoints}`} />
                <Metric label="Código" value={league.inviteCode} />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  padding: spacing[12],
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${colors.border}`
                }}
              >
                <span style={{ ...typography.small, color: colors.textMuted }}>ESTADO SOCIAL</span>
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textPrimary, fontWeight: 600 }}>
                  {league.position
                    ? `Estas compitiendo en el puesto #${league.position}.`
                    : "Tu posicion aparece cuando haya tabla materializada."}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                  {league.inviteLink
                    ? `Invite link listo para Epic 4: ${league.inviteLink}`
                    : "El join publico y el detalle real de liga se habilitan en Epic 4."}
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
