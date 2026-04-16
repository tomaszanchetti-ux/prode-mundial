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
import { ActionResultCard, CreateLeagueForm, JoinLeagueForm } from "./leagues-forms";

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
      <Card elevated style={{ gap: 10 }}>
        <span className="typo-small text-text-muted">LIGAS</span>
        <h1 className="typo-h2 m-0 text-text-primary">Tus ligas</h1>
        <p className="typo-body m-0 text-text-secondary">
          Competi con amigos. Crea una liga o unite con un codigo.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant={mode === "create" ? "secondary" : "primary"} onClick={() => onChangeMode(mode === "create" ? null : "create")}>
            {mode === "create" ? "Cancelar" : "Crear liga"}
          </Button>
          <Button variant={mode === "join" ? "secondary" : "ghost"} onClick={() => onChangeMode(mode === "join" ? null : "join")}>
            {mode === "join" ? "Cancelar" : "Unirme con codigo"}
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
        <Card elevated style={{ gap: 10 }}>
          <span className="typo-small text-text-muted">SIN LIGAS</span>
          <h2 className="typo-h3 m-0 text-text-primary">Todavia no competis en ninguna</h2>
          <p className="typo-body m-0 text-text-secondary">
            Crea tu primera liga o unite con un codigo para arrancar.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage
        ? items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: 10 }}>
              <div className="flex justify-between gap-2 items-center">
                <div className="grid gap-0.5">
                  <h2 className="typo-h3 m-0 text-text-primary">{league.name}</h2>
                  <span className="text-[13px] leading-[1.35] text-text-muted">
                    {league.membersCount}/{league.memberLimit} jugadores · {league.inviteCode}
                  </span>
                </div>
                <StatusTag status={league.isActive ? "editable" : "locked"} label={league.isActive ? "Activa" : "Cerrada"} />
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="grid gap-0.5 flex-1">
                  <span className="text-[13px] leading-[1.3] text-text-muted">Tu lugar</span>
                  <span className="text-[18px] leading-[1.2] text-text-primary font-bold">
                    {league.position ? `#${league.position}` : "—"}
                  </span>
                </div>
                <div className="grid gap-0.5 flex-1">
                  <span className="text-[13px] leading-[1.3] text-text-muted">Puntos</span>
                  <span className="text-[18px] leading-[1.2] text-text-primary font-bold">
                    {league.userPoints}
                  </span>
                </div>
                {league.inviteLink ? (
                  <CopyButton value={league.inviteLink} label="Invitar" />
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onOpenLeagueDetail(league.leagueId)}>
                  Detalle
                </Button>
                <Button variant="ghost" onClick={onOpenRankings}>
                  Posiciones
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
