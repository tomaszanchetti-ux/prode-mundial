"use client";

import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LeagueDetail, LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { AdSlotCard, Button, Card, ErrorCard, SkeletonCard, SkeletonStandingRow, StatusTag } from "@prode/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, createLeague, getLeagueStandings, getMyLeagues, getPoints, joinLeague } from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { CopyButton } from "./copy-button";
import { HighlightsCard } from "./highlights-card";
import { MiScoreSection } from "@/components/home/mi-score-widget";
import {
  GLOBAL_LEAGUE_ID,
  GLOBAL_LEAGUE_NAME,
  buildSyntheticSummary,
  pickLeagueHighlights,
  toPositionColor,
  toStandingRowClass,
  type LeagueOption
} from "./leagues-helpers";
import { ActionResultCard, CreateLeagueForm, JoinLeagueForm } from "./leagues-forms";

type LeaguesScreenViewProps = {
  items: LeagueSummary[];
  points: PointsResponse | null;
  standings: LeagueStandingsResponse | null;
  selectedLeagueId: string;
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
  onSelectLeague: (leagueId: string) => void;
  onRetry: () => void;
};

export function LeaguesScreenView({
  items,
  points,
  standings,
  selectedLeagueId,
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
  onSelectLeague,
  onRetry
}: LeaguesScreenViewProps) {
  const { locale } = useLocale();
  const options = useMemo<LeagueOption[]>(
    () => [
      { leagueId: GLOBAL_LEAGUE_ID, name: GLOBAL_LEAGUE_NAME, isGlobal: true },
      ...items.map((league) => ({ leagueId: league.leagueId, name: league.name, isGlobal: false }))
    ],
    [items]
  );

  const isGlobal = selectedLeagueId === GLOBAL_LEAGUE_ID;
  const summary = buildSyntheticSummary(points, standings, isGlobal);
  const highlights = pickLeagueHighlights(points);
  const selectedLeague = items.find((league) => league.leagueId === selectedLeagueId) ?? null;

  return (
    <div className="grid gap-4">
      <div className="flex gap-2 justify-end flex-wrap">
        <Button
          variant={mode === "create" ? "secondary" : "ghost"}
          onClick={() => onChangeMode(mode === "create" ? null : "create")}
        >
          {mode === "create" ? "Cancelar" : "Crear liga"}
        </Button>
        <Button
          variant={mode === "join" ? "secondary" : "ghost"}
          onClick={() => onChangeMode(mode === "join" ? null : "join")}
        >
          {mode === "join" ? "Cancelar" : "Unirme"}
        </Button>
      </div>

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
          onOpenLeague={onSelectLeague}
        />
      ) : null}

      {errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={onRetry} />
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto sticky top-0 z-[2] filter-bar-bg px-[2px]">
        {options.map((option) => {
          const isActive = option.leagueId === selectedLeagueId;

          return (
            <button
              key={option.leagueId}
              type="button"
              onClick={() => onSelectLeague(option.leagueId)}
              className={`filter-chip ${isActive ? "filter-chip-active" : "filter-chip-inactive"}`}
            >
              {option.name}
            </button>
          );
        })}
      </div>

      <Card elevated style={{ gap: 12 }}>
        {!isGlobal && summary.positionLabel !== "Sin puesto" ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[20px] font-extrabold text-text-primary tabular-nums leading-none">
              {summary.positionLabel}
            </span>
            {summary.gapLabel ? (
              <span className="text-[13px] text-text-muted leading-none">· {summary.gapLabel}</span>
            ) : null}
          </div>
        ) : null}

        <MiScoreSection points={points} />

        {!isGlobal && selectedLeague ? (
          <span className="text-[12px] leading-[1.35] text-text-muted">
            {selectedLeague.membersCount}/{selectedLeague.memberLimit} jugadores · código {selectedLeague.inviteCode}
          </span>
        ) : null}
      </Card>

      {isLoading ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStandingRow key={i} />
          ))}
        </div>
      ) : null}

      {!isLoading && !isGlobal && standings ? (
        <>
          <div className="grid gap-1">
            {standings.items.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] ${toStandingRowClass(entry)}`}
              >
                <span className={`text-[13px] font-bold w-[22px] text-center flex-shrink-0 tabular-nums ${toPositionColor(entry)}`}>
                  {entry.position}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-[14px] leading-[1.3] text-text-primary truncate block ${entry.isMe ? "font-bold" : "font-medium"}`}>
                    {entry.displayName}
                    {entry.isMe ? " (tu)" : ""}
                  </span>
                  <span className="text-[11px] leading-[1.3] text-text-muted tabular-nums">
                    E{entry.exactHits} · S{entry.correctSigns} · M{entry.macroPoints}
                  </span>
                </div>
                <span className={`text-[14px] font-bold flex-shrink-0 tabular-nums ${entry.isMe ? "text-primary-600" : entry.position === 1 ? "text-gold" : "text-text-primary"}`}>
                  {entry.totalPoints}
                </span>
              </div>
            ))}
          </div>
          <AdSlotCard
            description={copyForLocale(
              locale,
              "Espacio reservado para patrocinio nativo.",
              "Reserved slot for native sponsorship."
            )}
          />
        </>
      ) : null}

      {!isLoading && !isGlobal && !standings && selectedLeague ? (
        <Card className="surface-inset" style={{ gap: 8, padding: 16 }}>
          <span className="typo-small text-text-muted">SIN COMPETENCIA ACTIVA</span>
          <p className="typo-body m-0 text-text-secondary">
            Cuando la liga tenga predicciones puntuadas vas a ver la tabla aqui.
          </p>
        </Card>
      ) : null}

      <HighlightsCard highlights={highlights} />

      {!isGlobal && selectedLeague?.inviteLink ? (
        <div>
          <CopyButton value={selectedLeague.inviteLink} label="Invitar" shareLeagueId={selectedLeague.leagueId} />
        </div>
      ) : null}

      {isGlobal && items.length === 0 ? (
        <Card elevated style={{ gap: 10 }}>
          <span className="typo-small text-text-muted">SIN LIGAS PRIVADAS</span>
          <h2 className="typo-h3 m-0 text-text-primary">Todavia no competis en ninguna</h2>
          <p className="typo-body m-0 text-text-secondary">
            Crea tu primera liga o unite con un codigo para sumar competencia social.
          </p>
        </Card>
      ) : null}

      {isGlobal && items.length > 0 ? (
        <div className="grid gap-3">
          <span className="typo-small text-text-muted">MIS LIGAS PRIVADAS</span>
          {items.map((league) => (
            <Card key={league.leagueId} elevated style={{ gap: 10 }}>
              <div className="flex justify-between gap-2 items-center">
                <div className="grid gap-0.5">
                  <h3 className="typo-h3 m-0 text-text-primary">{league.name}</h3>
                  <span className="text-[13px] leading-[1.35] text-text-muted">
                    {league.position ? `#${league.position}` : "—"} · {league.userPoints} pts · {league.membersCount} jugadores
                  </span>
                </div>
                <StatusTag status={league.isActive ? "editable" : "neutral"} label={league.isActive ? "Activa" : "Cerrada"} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => onSelectLeague(league.leagueId)}>
                  Ver detalle
                </Button>
                {league.inviteLink ? (
                  <CopyButton value={league.inviteLink} label="Invitar" shareLeagueId={league.leagueId} />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LeaguesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const [items, setItems] = useState<LeagueSummary[]>([]);
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [standings, setStandings] = useState<LeagueStandingsResponse | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(searchParams.get("leagueId") ?? GLOBAL_LEAGUE_ID);
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
    const nextLeagueId = searchParams.get("leagueId");

    if (nextLeagueId && nextLeagueId !== selectedLeagueId) {
      setSelectedLeagueId(nextLeagueId);
    }
  }, [searchParams, selectedLeagueId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setPoints(null);
        setStandings(null);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [leaguesResponse, pointsResponse] = await Promise.all([getMyLeagues(token), getPoints(token)]);

        const isPrivateLeague = selectedLeagueId !== GLOBAL_LEAGUE_ID;
        const standingsResponse = isPrivateLeague ? await getLeagueStandings(token, selectedLeagueId) : null;

        if (!cancelled) {
          setItems(leaguesResponse.items);
          setPoints(pointsResponse);
          setStandings(standingsResponse);
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
  }, [reloadKey, selectedLeagueId, status, user]);

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

      track("league_created", { leagueId: league.leagueId });
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

      track("league_joined", { leagueId: league.leagueId, joinMethod: "code" });
      setLastActionLeague(league);
      setActionMessage("Ya formas parte de la liga. Seleccionala en el selector para ver la tabla.");
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
      points={points}
      standings={standings}
      selectedLeagueId={selectedLeagueId}
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
      onSelectLeague={(leagueId) => {
        setSelectedLeagueId(leagueId);

        if (leagueId === GLOBAL_LEAGUE_ID) {
          router.replace("/leagues");
        } else {
          router.replace(`/leagues?leagueId=${leagueId}`);
        }
      }}
      onRetry={() => setReloadKey((value) => value + 1)}
    />
  );
}
