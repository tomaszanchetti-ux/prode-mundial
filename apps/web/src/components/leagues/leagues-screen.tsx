"use client";

import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { LeagueDetail, LeagueSummary } from "@prode/shared";
import { Button, Card, StatusTag } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, createLeague, getMyLeagues, joinLeague } from "@/lib/api/client";
import { CopyButton } from "./copy-button";
import { ActionResultCard, CreateLeagueForm, JoinLeagueForm, Metric } from "./leagues-forms";

type LeaguesScreenViewProps = {
  items: LeagueSummary[];
  mode: "create" | "join" | null;
  formState: {
    leagueName: string;
    inviteCode: string;
  };
  actionError: string | null;
  actionMessage: string | null;
  lastActionLeague: LeagueDetail | null;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onChangeMode: (mode: "create" | "join" | null) => void;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCreateLeague: (event: FormEvent<HTMLFormElement>) => void;
  onJoinLeague: (event: FormEvent<HTMLFormElement>) => void;
  onOpenRankings: () => void;
  onOpenLeagueDetail: (leagueId: string) => void;
  onRetry: () => void;
};

export function LeaguesScreenView({
  items,
  mode,
  formState,
  actionError,
  actionMessage,
  lastActionLeague,
  isLoading,
  isSubmitting,
  errorMessage,
  onChangeMode,
  onFieldChange,
  onCreateLeague,
  onJoinLeague,
  onOpenRankings,
  onOpenLeagueDetail,
  onRetry
}: LeaguesScreenViewProps) {
  return (
    <div className="grid gap-4">
      <Card elevated style={{ gap: 12 }}>
        <span className="typo-small text-text-muted">LIGAS</span>
        <h1 className="typo-h2 m-0 text-text-primary">Tus ligas y tu lugar en cada una</h1>
        <p className="typo-body m-0 text-text-secondary">
          Crea una liga, sumate con un codigo y segui tu competencia sin salir de esta pantalla.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant={mode === "create" ? "secondary" : "primary"} onClick={() => onChangeMode(mode === "create" ? null : "create")}>
            {mode === "create" ? "Ocultar crear liga" : "Crear liga"}
          </Button>
          <Button variant={mode === "join" ? "secondary" : "ghost"} onClick={() => onChangeMode(mode === "join" ? null : "join")}>
            {mode === "join" ? "Ocultar join" : "Unirme con codigo"}
          </Button>
          <Button variant="ghost" onClick={onOpenRankings}>
            Ver posiciones
          </Button>
        </div>
      </Card>

      {mode === "create" ? (
        <CreateLeagueForm
          formState={formState}
          isSubmitting={isSubmitting}
          onFieldChange={onFieldChange}
          onSubmit={onCreateLeague}
        />
      ) : null}

      {mode === "join" ? (
        <JoinLeagueForm
          formState={formState}
          isSubmitting={isSubmitting}
          onFieldChange={onFieldChange}
          onSubmit={onJoinLeague}
        />
      ) : null}

      {actionError ? (
        <Card elevated style={{ gap: 12 }}>
          <span className="typo-small text-error">NO PUDIMOS COMPLETAR LA ACCION</span>
          <p className="typo-body m-0 text-text-primary">{actionError}</p>
        </Card>
      ) : null}

      {lastActionLeague ? (
        <ActionResultCard
          actionMessage={actionMessage}
          league={lastActionLeague}
          onOpenLeagueDetail={onOpenLeagueDetail}
          onOpenRankings={onOpenRankings}
        />
      ) : null}

      {errorMessage ? (
        <Card elevated style={{ gap: 12 }}>
          <p className="typo-body m-0 text-text-primary">{errorMessage}</p>
          <Button onClick={onRetry}>Reintentar</Button>
        </Card>
      ) : null}

      {isLoading ? (
        <Card elevated style={{ gap: 8 }}>
          <div className="w-[96px] h-[10px] rounded-full bg-bg-muted" />
          <div className="w-full h-[56px] rounded-[16px] bg-bg-muted" />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card elevated style={{ gap: 12 }}>
          <span className="typo-small text-text-muted">SIN LIGAS TODAVIA</span>
          <h2 className="typo-h3 m-0 text-text-primary">Todavia no estas compitiendo en ninguna</h2>
          <p className="typo-body m-0 text-text-secondary">
            Arriba ya puedes crear tu primera liga o entrar con un codigo. Cuando exista competencia materializada, tu posicion aparece aqui.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage
        ? items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: 12 }}>
              <div className="flex justify-between gap-3 items-start">
                <div className="grid gap-1.5">
                  <span className="typo-small text-text-muted">LIGA ACTIVA</span>
                  <h2 className="typo-h3 m-0 text-text-primary">{league.name}</h2>
                  <p className="text-[14px] leading-[1.4] m-0 text-text-secondary">
                    {league.membersCount}/{league.memberLimit} jugadores
                  </p>
                </div>
                <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Inactiva"} />
              </div>

              <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                <Metric label="Tu lugar" value={league.position ? `#${league.position}` : "Sin tabla"} />
                <Metric label="Tus puntos" value={`${league.userPoints}`} />
                <Metric label="Código" value={league.inviteCode} />
              </div>

              <div className="grid gap-1.5 p-3 rounded-[16px] surface-inset">
                <div className="flex justify-between gap-2 items-center">
                  <span className="typo-small text-text-muted">ESTADO SOCIAL</span>
                  {league.inviteLink ? <CopyButton value={league.inviteLink} label="Copiar link" /> : null}
                </div>
                <p className="text-[14px] leading-[1.4] m-0 text-text-primary font-semibold">
                  {league.position
                    ? `Estas compitiendo en el puesto #${league.position}.`
                    : "Tu posicion aparece cuando haya tabla materializada."}
                </p>
                <p className="text-[14px] leading-[1.4] m-0 text-text-secondary break-all">
                  {league.inviteLink
                    ? `Comparte este acceso cuando quieras sumar mas gente: ${league.inviteLink}`
                    : "Todavia no tenemos invite link disponible para esta liga."}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => onOpenLeagueDetail(league.leagueId)}>
                  Ver detalle
                </Button>
                <Button variant="ghost" onClick={onOpenRankings}>
                  Ver posiciones
                </Button>
              </div>
            </Card>
          ))
        : null}
    </div>
  );
}

export function LeaguesScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [items, setItems] = useState<LeagueSummary[]>([]);
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [formState, setFormState] = useState({
    leagueName: "",
    inviteCode: ""
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastActionLeague, setLastActionLeague] = useState<LeagueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setActionError("No encontramos una sesion activa.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const league = await createLeague(token, {
        name: formState.leagueName
      });

      setLastActionLeague(league);
      setActionMessage("Liga creada. Ya tienes codigo e invite link para compartir.");
      setFormState((current) => ({ ...current, leagueName: "" }));
      setMode(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "No pudimos crear la liga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setActionError("No encontramos una sesion activa.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const league = await joinLeague(token, {
        inviteCode: formState.inviteCode
      });

      setLastActionLeague(league);
      setActionMessage("Ya formas parte de la liga. Tu tabla se actualiza desde posiciones.");
      setFormState((current) => ({ ...current, inviteCode: "" }));
      setMode(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "No pudimos unirte a la liga.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LeaguesScreenView
      items={items}
      mode={mode}
      formState={formState}
      actionError={actionError}
      actionMessage={actionMessage}
      lastActionLeague={lastActionLeague}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onChangeMode={(nextMode) => {
        setMode(nextMode);
        setActionError(null);
      }}
      onFieldChange={handleFieldChange}
      onCreateLeague={handleCreateLeague}
      onJoinLeague={handleJoinLeague}
      onOpenRankings={() => router.push("/rankings")}
      onOpenLeagueDetail={(leagueId) => router.push(`/leagues/${leagueId}`)}
      onRetry={() => setReloadKey((value) => value + 1)}
    />
  );
}
