"use client";

import { useEffect, useState } from "react";
import { Button, Card, StatusTag, colors, spacing, typography } from "@prode/ui";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getLeagueDetail } from "@/lib/api/client";

type LeagueDetailState = Awaited<ReturnType<typeof getLeagueDetail>>;

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

export function LeagueDetailScreen() {
  const router = useRouter();
  const params = useParams<{ leagueId: string }>();
  const { status, user } = useAuth();
  const [league, setLeague] = useState<LeagueDetailState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user || !params?.leagueId) {
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const response = await getLeagueDetail(token, params.leagueId);

        if (!cancelled) {
          setLeague(response);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos cargar el detalle de la liga.");
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
  }, [params?.leagueId, reloadKey, status, user]);

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>DETALLE DE LIGA</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{league?.name ?? "Tu liga"}</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Revisa el estado de la liga, comparte el acceso y salta directo a la tabla competitiva.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={() => router.push(`/rankings?leagueId=${params.leagueId}`)}>Ver posiciones</Button>
          <Button variant="ghost" onClick={() => router.push("/leagues")}>
            Volver a ligas
          </Button>
        </div>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button onClick={() => setReloadKey((value) => value + 1)}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: spacing[8] }}>
          <div style={{ width: 96, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
          <div style={{ width: "100%", height: 120, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
        </Card>
      ) : null}

      {league ? (
        <>
          <Card elevated style={{ gap: spacing[12] }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ ...typography.small, color: colors.textMuted }}>ESTADO</span>
                <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{league.name}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>
                  {league.membersCount}/{league.memberLimit} jugadores
                </p>
              </div>
              <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Inactiva"} />
            </div>
            <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
              <Metric label="Codigo" value={league.inviteCode} />
              <Metric label="Tu rol" value={league.membershipRole === "owner" ? "Creador" : "Miembro"} />
              <Metric label="Tu puesto" value={league.myStanding ? `#${league.myStanding.position}` : "Sin tabla"} />
            </div>
          </Card>

          <Card elevated style={{ gap: spacing[12] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>COMPARTIR</span>
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
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textPrimary, fontWeight: 600 }}>Invite link</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary, wordBreak: "break-all" }}>
                {league.inviteLink ?? "No hay link disponible para esta liga."}
              </span>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
