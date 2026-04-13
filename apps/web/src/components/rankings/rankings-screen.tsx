"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { Button, Card, StatusTag, colors, spacing, typography } from "@prode/ui";
import { useRouter, useSearchParams } from "next/navigation";
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
  const selectedLeague = leagues.find((league) => league.leagueId === selectedLeagueId) ?? null;
  const leader = standings?.items[0] ?? null;

  return (
    <div style={{ display: "grid", gap: spacing[16] }}>
      <Card elevated style={{ gap: spacing[12] }}>
        <span style={{ ...typography.small, color: colors.textMuted }}>POSICIONES</span>
        <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>Tu competencia liga por liga</h1>
        <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
          Mira dónde estás parado, quién marca el ritmo y cuánto te falta para alcanzar la punta.
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
            <span style={{ ...typography.small, color: colors.primary500 }}>TU RESUMEN</span>
            <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>{points.totalPoints} pts</h2>
          </div>

          <div style={{ display: "grid", gap: spacing[8], gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <Metric label="Exactos" value={String(points.exactHits)} />
            <Metric label="Signos" value={String(points.correctSigns)} />
            <Metric label="Macro" value={String(points.macroPoints)} />
          </div>

          <div style={{ display: "grid", gap: spacing[8] }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>ULTIMOS PUNTOS</span>
            {points.recentMatches.length === 0 ? (
              <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, color: colors.textSecondary }}>Tus ultimos puntos van a aparecer aqui.</p>
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
          <span style={{ ...typography.small, color: colors.gold500 }}>TU LIGA</span>
          <h2 style={{ ...typography.h3, margin: 0, color: colors.textPrimary }}>Tabla competitiva</h2>
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gap: spacing[8] }}>
            <div style={{ width: 104, height: 10, borderRadius: 999, background: "rgba(148, 163, 184, 0.16)" }} />
            <div style={{ width: "100%", height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
            <div style={{ width: "100%", height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)" }} />
          </div>
        ) : null}

        {!isLoading && leagues.length === 0 ? (
          <Card style={{ gap: spacing[8], padding: spacing[16], background: "rgba(255,255,255,0.02)" }}>
            <span style={{ ...typography.small, color: colors.textMuted }}>SIN COMPETENCIA ACTIVA</span>
            <p style={{ ...typography.body, margin: 0, color: colors.textSecondary }}>
              Todavia no hay ligas para mostrar. Crea una o unete a una desde la tab de ligas para ver tu tabla competitiva aqui.
            </p>
          </Card>
        ) : null}

        {leagues.length > 0 ? (
          <div style={{ display: "grid", gap: spacing[12] }}>
            <div
              style={{
                display: "grid",
                gap: spacing[10],
                padding: spacing[14],
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ ...typography.small, color: colors.textMuted }}>LIGA ACTIVA</span>
                <strong style={{ fontSize: 18, lineHeight: 1.2, color: colors.textPrimary }}>
                  {selectedLeague?.name ?? leagues[0]?.name ?? "Tu liga"}
                </strong>
                {selectedLeague ? (
                  <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                    {selectedLeague.membersCount}/{selectedLeague.memberLimit} jugadores
                  </span>
                ) : null}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 14, lineHeight: 1.35, color: colors.textPrimary, fontWeight: 600 }}>
                  {standings?.myStanding
                    ? `Vas #${standings.myStanding.position} con ${standings.myStanding.totalPoints} pts`
                    : "Tu posicion aparece cuando haya tabla"}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.35, color: colors.textSecondary }}>
                  {leader
                    ? `La punta la marca ${leader.displayName} con ${leader.totalPoints} pts.`
                    : "Cuando exista competencia activa vas a ver aqui la distancia con la punta."}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {leagues.map((league) => (
                <Button
                  key={league.leagueId}
                  variant={selectedLeagueId === league.leagueId ? "secondary" : "ghost"}
                  style={{ minHeight: 40, padding: "0 14px" }}
                  onClick={() => onSelectLeague(league.leagueId)}
                >
                  {league.name}
                </Button>
              ))}
            </div>
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
                  background:
                    entry.isMe
                      ? "rgba(47, 107, 255, 0.14)"
                      : entry.position === 1
                        ? "rgba(231, 198, 106, 0.14)"
                        : entry.position <= 3
                          ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(255,255,255,0.03)",
                  border: `1px solid ${entry.isMe ? colors.primary500 : entry.position === 1 ? colors.gold500 : entry.position <= 3 ? colors.borderStrong : colors.border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: spacing[12], alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: entry.isMe ? colors.primary500 : entry.position === 1 ? colors.gold500 : colors.textMuted, fontSize: 14, fontWeight: 700 }}>
                      #{entry.position}
                    </span>
                    <span style={{ color: colors.textPrimary, fontWeight: entry.isMe ? 700 : 600 }}>
                      {entry.displayName}
                      {entry.isOwner ? " · creador" : ""}
                      {entry.isMe ? " · tu posicion" : ""}
                    </span>
                  </div>
                  <StatusTag status={entry.isMe ? "editable" : entry.position === 1 ? "live" : "scored"} label={`${entry.totalPoints} pts`} />
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [standings, setStandings] = useState<LeagueStandingsResponse | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(searchParams.get("leagueId"));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const nextLeagueId = searchParams.get("leagueId");
    setSelectedLeagueId((current) => (nextLeagueId && nextLeagueId !== current ? nextLeagueId : current));
  }, [searchParams]);

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
      onSelectLeague={(leagueId) => {
        setSelectedLeagueId(leagueId);
        router.replace(`/rankings?leagueId=${leagueId}`);
      }}
      onRetry={() => setReloadKey((value) => value + 1)}
    />
  );
}
