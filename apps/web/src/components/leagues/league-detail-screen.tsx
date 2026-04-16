"use client";

import { useEffect, useState } from "react";
import { Button, Card, SkeletonCard, StatusTag } from "@prode/ui";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getLeagueDetail } from "@/lib/api/client";
import { CopyButton } from "./copy-button";

type LeagueDetailState = Awaited<ReturnType<typeof getLeagueDetail>>;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 p-3 surface-inset">
      <span className="typo-small text-text-muted">{label}</span>
      <span className="typo-h3 m-0 text-text-primary">{value}</span>
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
    <div className="grid gap-4">
      <Card elevated style={{ gap: 12 }}>
        <span className="typo-small text-text-muted">DETALLE DE LIGA</span>
        <h1 className="typo-h2 m-0 text-text-primary">{league?.name ?? "Tu liga"}</h1>
        <p className="typo-body m-0 text-text-secondary">
          {league?.membersCount ?? 0} miembros · {league?.isActive ? "Abierta" : "Cerrada"}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => router.push(`/rankings?leagueId=${params.leagueId}`)}>Ver posiciones</Button>
          <Button variant="ghost" onClick={() => router.push("/leagues")}>
            Volver a ligas
          </Button>
        </div>
      </Card>

      {errorMessage ? (
        <Card elevated style={{ gap: 12 }}>
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          <Button onClick={() => setReloadKey((value) => value + 1)}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? <SkeletonCard lines={3} /> : null}

      {league ? (
        <>
          <Card elevated style={{ gap: 12 }}>
            <div className="flex justify-between gap-3 items-start">
              <div className="grid gap-1.5">
                <span className="typo-small text-text-muted">ESTADO</span>
                <h2 className="typo-h3 m-0 text-text-primary">{league.name}</h2>
                <p className="text-[14px] leading-[1.4] m-0 text-text-secondary">
                  {league.membersCount}/{league.memberLimit} jugadores
                </p>
              </div>
              <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Inactiva"} />
            </div>
            <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
              <Metric label="Codigo" value={league.inviteCode} />
              <Metric label="Tu rol" value={league.membershipRole === "owner" ? "Creador" : "Miembro"} />
              <Metric label="Tu puesto" value={league.myStanding ? `#${league.myStanding.position}` : "Sin tabla"} />
            </div>
          </Card>

          <Card elevated style={{ gap: 12 }}>
            <span className="typo-small text-text-muted">COMPARTIR</span>
            <div className="grid gap-1.5 p-3 rounded-[16px] surface-inset">
              <div className="flex justify-between gap-2 items-center">
                <span className="text-[14px] leading-[1.4] text-text-primary font-semibold">Invite link</span>
                {league.inviteLink ? <CopyButton value={league.inviteLink} label="Copiar link" /> : null}
              </div>
              <span className="text-[14px] leading-[1.4] text-text-secondary break-all">
                {league.inviteLink ?? "No hay link disponible para esta liga."}
              </span>
              {league.inviteCode ? (
                <div className="flex justify-between gap-2 items-center pt-2 border-t border-border-default">
                  <span className="text-[13px] leading-[1.4] text-text-secondary">
                    Codigo: <span className="text-text-primary font-semibold">{league.inviteCode}</span>
                  </span>
                  <CopyButton value={league.inviteCode} label="Copiar codigo" />
                </div>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
