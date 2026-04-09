"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { Button, Card, StatusTag, colors, spacing, typography } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getLeagueStandings, getMyLeagues, getPoints } from "@/lib/api/client";

type RankingsScreenViewProps = {
  leagues: LeagueSummary[];
  points: PointsResponse | null;
  standings: LeagueStandingsResponse | null;
  selectedLeagueId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectLeague: (leagueId: string) => void;
  onRetry: () => void;
};

export function RankingsScreenView({
  leagues,
  points,
  standings,
  selectedLeagueId,
  isLoading,
  errorMessage,
  onSelectLeague,
  onRetry
}: RankingsScreenViewProps) {
  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>POSICIONES</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tus puntos y tu lugar en cada liga</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Esta vista ya usa datos reales de puntos y standings por liga, sin ranking global.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <p style={{ ...typography.body, margin: 0, color: colors.textPrimary }}>{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {points ? (
        <Card elevated style={{ gap: spacing[12] }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.small, color: colors.primary500 }}>MIS PUNTOS</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{points.totalPoints} pts</h2>
          </div>

          <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <Metric label="Exactos" value={String(points.exactHits)} />
            <Metric label="Signos" value={String(points.correctSigns)} />
            <Metric label="Macro" value={String(points.macroPoints)} />
          </div>

          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>ÚLTIMOS PARTIDOS PUNTUADOS</span>
            {points.recentMatches.length === 0 ? (
              <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>Todavía no hay puntos recientes para mostrar.</p>
            ) : (
              points.recentMatches.map((entry) => (
                <div
                  key={entry.matchId}
                  style={{
                    display: "grid",
                    gap: 4,
                    padding: spacing[12],
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
                    <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{entry.matchLabel}</span>
                    <StatusTag status="scored" label={`+${entry.points} pts`} />
                  </div>
                  <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                    {entry.stageLabel} · exacto {entry.breakdown.pointsExact90} · signo {entry.breakdown.pointsOutcome90} · clasificado {entry.breakdown.pointsQualifier}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: spacing[12] }}>
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ ...typography.small, color: colors.gold500 }}>TABLAS DE LIGA</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Ranking materializado</h2>
        </div>

        {isLoading ? <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>Cargando standings...</p> : null}

        {!isLoading && leagues.length === 0 ? (
          <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>No hay ligas disponibles para mostrar todavía.</p>
        ) : null}

        {leagues.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {leagues.map((league) => (
              <Button
                key={league.leagueId}
                variant={selectedLeagueId === league.leagueId ? "primary" : "ghost"}
                onClick={() => onSelectLeague(league.leagueId)}
              >
                {league.name}
              </Button>
            ))}
          </div>
        ) : null}

        {standings ? (
          <div style={{ display: "grid", gap: spacing[8] }}>
            {standings.items.map((entry) => (
              <div
                key={entry.userId}
                style={{
                  display: "grid",
                  gap: 6,
                  padding: spacing[12],
                  borderRadius: 16,
                  background: entry.isMe ? "rgba(47, 107, 255, 0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${entry.isMe ? colors.primary500 : colors.border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: colors.textMuted, fontSize: 14, fontWeight: 700 }}>#{entry.position}</span>
                    <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                      {entry.displayName}
                      {entry.isOwner ? " · owner" : ""}
                    </span>
                  </div>
                  <StatusTag status={entry.isMe ? "editable" : "scored"} label={`${entry.totalPoints} pts`} />
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.4, color: colors.textSecondary }}>
                  Exactos {entry.exactHits} · Signos {entry.correctSigns} · Macro {entry.macroPoints}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
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

export function RankingsScreen() {
  const { status, user } = useAuth();
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [standings, setStandings] = useState<LeagueStandingsResponse | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user) {
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [pointsResponse, leaguesResponse] = await Promise.all([getPoints(token), getMyLeagues(token)]);
        const nextLeagueId = selectedLeagueId ?? leaguesResponse.items[0]?.leagueId ?? null;
        const standingsResponse = nextLeagueId ? await getLeagueStandings(token, nextLeagueId) : null;

        if (!cancelled) {
          setPoints(pointsResponse);
          setLeagues(leaguesResponse.items);
          setSelectedLeagueId(nextLeagueId);
          setStandings(standingsResponse);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof ApiClientError ? error.message : "No pudimos cargar puntos y rankings.");
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
  }, [reloadKey, selectedLeagueId, status, user]);

  return (
    <RankingsScreenView
      leagues={leagues}
      points={points}
      standings={standings}
      selectedLeagueId={selectedLeagueId}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onSelectLeague={setSelectedLeagueId}
      onRetry={() => setReloadKey((value) => value + 1)}
    />
  );
}
