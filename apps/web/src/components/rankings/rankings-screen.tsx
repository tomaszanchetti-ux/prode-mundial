"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { Button, Card, StatusTag } from "@prode/ui";
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

function toStandingRowClass(entry: { isMe: boolean; position: number }) {
  if (entry.isMe) return "standing-me";
  if (entry.position === 1) return "standing-leader";
  if (entry.position <= 3) return "standing-podium";
  return "standing-default";
}

function toPositionColor(entry: { isMe: boolean; position: number }) {
  if (entry.isMe) return "text-primary-500";
  if (entry.position === 1) return "text-gold";
  return "text-text-muted";
}

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
    <div className="grid gap-4">
      <Card elevated style={{ gap: 10 }}>
        <span className="typo-small text-text-muted">POSICIONES</span>
        <h1 className="typo-h2 m-0 text-text-primary">Tabla de posiciones</h1>
        <p className="typo-body m-0 text-text-secondary">
          Tu lugar en cada liga, quien lidera y cuanto falta para la punta.
        </p>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: 12 }}>
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {points ? (
        <Card elevated style={{ gap: 12 }}>
          <div className="grid gap-1.5">
            <span className="typo-small text-primary-500">TU RESUMEN</span>
            <h2 className="typo-h3 m-0 text-text-primary">{points.totalPoints} pts</h2>
          </div>

          <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
            <Metric label="Match" value={String(points.totals.matchPoints)} />
            <Metric label="Macro" value={String(points.totals.macroPoints)} />
            <Metric label="Exactos" value={String(points.totals.exactHits)} />
            <Metric label="Signos" value={String(points.totals.correctSigns)} />
          </div>

          <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
            <Metric label="Grupos" value={String(points.byStage.group)} />
            <Metric label="R32" value={String(points.byStage.R32)} />
            <Metric label="R16" value={String(points.byStage.R16)} />
            <Metric label="QF" value={String(points.byStage.QF)} />
            <Metric label="SF" value={String(points.byStage.SF)} />
            <Metric label="Final" value={String(points.byStage.FINAL)} />
          </div>

          <div className="grid gap-2">
            <span className="typo-small text-text-muted">ULTIMOS PUNTOS</span>
            {points.recentMatches.length === 0 ? (
              <p className="text-[14px] leading-[1.4] m-0 text-text-secondary">Tus ultimos puntos van a aparecer aqui.</p>
            ) : (
              points.recentMatches.map((entry) => (
                <div
                  key={entry.matchId}
                  className="grid gap-1 p-3 surface-inset"
                >
                  <div className="flex justify-between gap-3 items-center">
                    <span className="text-text-primary font-semibold">{entry.matchLabel}</span>
                    <StatusTag status="scored" label={`+${entry.points} pts`} />
                  </div>
                  <span className="text-[14px] leading-[1.4] text-text-secondary">
                    {entry.stageLabel} · exacto {entry.breakdown.pointsExact90} · signo {entry.breakdown.pointsOutcome90} · clasificado {entry.breakdown.pointsQualifier}
                  </span>
                  <span className="text-[13px] leading-[1.35] text-text-muted">
                    Tu pick {entry.userPredictionSummary} · oficial {entry.officialResultSummary}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      <Card elevated style={{ gap: 12 }}>
        <div className="grid gap-1.5">
          <span className="typo-small text-gold">TU LIGA</span>
          <h2 className="typo-h3 m-0 text-text-primary">Tabla competitiva</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-2">
            <div className="w-[104px] h-[10px] rounded-full bg-bg-muted" />
            <div className="w-full h-[56px] rounded-[16px] bg-bg-muted" />
            <div className="w-full h-[56px] rounded-[16px] bg-bg-muted" />
          </div>
        ) : null}

        {!isLoading && leagues.length === 0 ? (
          <Card className="surface-inset" style={{ gap: 8, padding: 16 }}>
            <span className="typo-small text-text-muted">SIN COMPETENCIA ACTIVA</span>
            <p className="typo-body m-0 text-text-secondary">
              Todavia no hay ligas para mostrar. Crea una o unete a una desde la tab de ligas para ver tu tabla competitiva aqui.
            </p>
          </Card>
        ) : null}

        {leagues.length > 0 ? (
          <div className="grid gap-3">
            <div className="grid gap-2.5 p-[14px] rounded-[16px] surface-inset">
              <div className="grid gap-1">
                <span className="typo-small text-text-muted">LIGA ACTIVA</span>
                <strong className="text-[18px] leading-[1.2] text-text-primary">
                  {selectedLeague?.name ?? leagues[0]?.name ?? "Tu liga"}
                </strong>
                {selectedLeague ? (
                  <span className="text-[13px] leading-[1.35] text-text-secondary">
                    {selectedLeague.membersCount}/{selectedLeague.memberLimit} jugadores
                  </span>
                ) : null}
              </div>
              <div className="grid gap-1">
                <span className="text-[14px] leading-[1.35] text-text-primary font-semibold">
                  {standings?.myStanding
                    ? `Vas #${standings.myStanding.position} con ${standings.myStanding.totalPoints} pts`
                    : "Tu posicion aparece cuando haya tabla"}
                </span>
                <span className="text-[13px] leading-[1.35] text-text-secondary">
                  {leader
                    ? `La punta la marca ${leader.displayName} con ${leader.totalPoints} pts.`
                    : "Cuando exista competencia activa vas a ver aqui la distancia con la punta."}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto px-[2px]">
              {leagues.map((league) => {
                const isActive = selectedLeagueId === league.leagueId;

                return (
                  <button
                    key={league.leagueId}
                    type="button"
                    onClick={() => onSelectLeague(league.leagueId)}
                    className={`filter-chip ${isActive ? "filter-chip-active" : "filter-chip-inactive"}`}
                  >
                    {league.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {standings ? (
          <div className="grid gap-[6px]">
            {standings.items.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-2 px-3 py-2 rounded-[10px] ${toStandingRowClass(entry)}`}
              >
                <span className={`text-[13px] font-bold w-[24px] text-center flex-shrink-0 ${toPositionColor(entry)}`}>
                  {entry.position}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-[14px] leading-[1.3] text-text-primary truncate block ${entry.isMe ? "font-bold" : "font-medium"}`}>
                    {entry.displayName}
                    {entry.isMe ? " (tu)" : ""}
                  </span>
                  <span className="text-[12px] leading-[1.3] text-text-muted">
                    E{entry.exactHits} · S{entry.correctSigns} · M{entry.macroPoints}
                  </span>
                </div>
                <span className={`text-[14px] font-bold flex-shrink-0 ${entry.isMe ? "text-primary-600" : entry.position === 1 ? "text-gold" : "text-text-primary"}`}>
                  {entry.totalPoints}
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
    <div className="grid gap-1 p-3 surface-inset">
      <span className="typo-small text-text-muted">{label}</span>
      <span className="typo-h3 m-0 text-text-primary">{value}</span>
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
