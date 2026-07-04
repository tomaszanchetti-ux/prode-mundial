"use client";

import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { GlobalStandingsResponse, LeagueDetail, LeagueStandingsResponse, LeagueSummary, PointsResponse } from "@prode/shared";
import { AdSlotCard, Button, Card, ErrorCard, SkeletonCard, SkeletonStandingRow, StatusTag } from "@prode/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale, type AppLocale } from "@/lib/i18n/locale-provider";
import {
  ApiClientError,
  createLeague,
  deleteLeague,
  getGlobalStandings,
  getLeagueStandings,
  getMyLeagues,
  getPoints,
  joinLeague,
  leaveLeague
} from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { ShareInviteButton } from "./share-invite-button";
import { MiScoreSection } from "@/components/home/mi-score-widget";
import {
  GLOBAL_LEAGUE_ID,
  GLOBAL_LEAGUE_NAME,
  buildSyntheticSummary,
  toGlobalStandingsView,
  toPositionColor,
  toStandingRowClass,
  type LeagueOption
} from "./leagues-helpers";
import { ActionResultCard, CreateLeagueForm, JoinLeagueForm } from "./leagues-forms";
import { GlobalStandingsTable } from "./global-standings-table";
import { LeagueConfirmModal, type LeagueConfirmAction } from "./league-confirm-modal";

const userLeagueLimitCopy = (locale: AppLocale) =>
  copyForLocale(
    locale,
    "Solo podés estar en 3 ligas a la vez. Salí de una actual para sumarte a otra o mejorá tu plan para participar en ligas ilimitadas.",
    "You can only be in 3 leagues at a time. Leave one to join another, or upgrade your plan for unlimited leagues."
  );

const leagueCapacityCopy = (locale: AppLocale) =>
  copyForLocale(
    locale,
    "Esta liga ya alcanzó el máximo de 20 jugadores. Conocé los planes Gold y Enterprise para ligas con más cupo.",
    "This league already reached the 20-player limit. Check out the Gold and Enterprise plans for larger leagues."
  );

type ActionErrorState = { message: string; showPlansCta?: boolean } | null;

type LeaguesScreenViewProps = {
  items: LeagueSummary[];
  points: PointsResponse | null;
  standings: LeagueStandingsResponse | null;
  globalStandings: GlobalStandingsResponse | null;
  selectedLeagueId: string;
  mode: "create" | "join" | null;
  formState: {
    leagueName: string;
    inviteCode: string;
  };
  actionError: ActionErrorState;
  actionMessage: string | null;
  lastActionLeague: LeagueDetail | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isOwnerOfSelected: boolean;
  errorMessage: string | null;
  onChangeMode: (mode: "create" | "join" | null) => void;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCreateLeague: (event: FormEvent<HTMLFormElement>) => void;
  onJoinLeague: (event: FormEvent<HTMLFormElement>) => void;
  onSelectLeague: (leagueId: string) => void;
  onRequestLeaveOrDelete: (action: LeagueConfirmAction, leagueId: string, leagueName: string) => void;
  onDismissActionResult: () => void;
  onRetry: () => void;
};

export function LeaguesScreenView({
  items,
  points,
  standings,
  globalStandings,
  selectedLeagueId,
  mode,
  formState,
  actionError,
  actionMessage,
  lastActionLeague,
  isLoading,
  isSubmitting,
  isOwnerOfSelected,
  errorMessage,
  onChangeMode,
  onFieldChange,
  onCreateLeague,
  onJoinLeague,
  onSelectLeague,
  onRequestLeaveOrDelete,
  onDismissActionResult,
  onRetry
}: LeaguesScreenViewProps) {
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);
  const options = useMemo<LeagueOption[]>(
    () => [
      { leagueId: GLOBAL_LEAGUE_ID, name: GLOBAL_LEAGUE_NAME, isGlobal: true },
      ...items.map((league) => ({ leagueId: league.leagueId, name: league.name, isGlobal: false }))
    ],
    [items]
  );

  const isGlobal = selectedLeagueId === GLOBAL_LEAGUE_ID;
  const summary = buildSyntheticSummary(
    points,
    isGlobal ? toGlobalStandingsView(globalStandings) : standings,
    isGlobal,
    locale
  );
  const selectedLeague = items.find((league) => league.leagueId === selectedLeagueId) ?? null;

  return (
    <div className="grid gap-4">
      <div className="flex gap-1.5 overflow-x-auto filter-bar-flush px-[2px]">
        {options.map((option) => {
          const isActive = option.leagueId === selectedLeagueId;

          return (
            <button
              key={option.leagueId}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelectLeague(option.leagueId)}
              className={`filter-chip ${isActive ? "filter-chip-active" : "filter-chip-inactive"}`}
            >
              {option.name}
            </button>
          );
        })}
      </div>

      <Card elevated style={{ gap: 10 }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <MiScoreSection points={points} compact />
          </div>
          {summary.hasStanding ? (
            <div className="grid gap-0.5 text-right shrink-0">
              <span className="text-[28px] leading-none font-black text-primary-600 tabular-nums">
                {summary.positionLabel}
              </span>
              {summary.gapLabel ? (
                <span className="text-[12px] leading-[1.3] text-text-muted tabular-nums">
                  {summary.gapLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {isGlobal && globalStandings ? (
          <span className="typo-meta">
            {globalStandings.participantsCount} {t("jugadores en ligas activas", "players in active leagues")}
          </span>
        ) : null}

        {!isGlobal && selectedLeague ? (
          <span className="typo-meta">
            {selectedLeague.membersCount}/{selectedLeague.memberLimit} {t("jugadores · código", "players · code")} {selectedLeague.inviteCode}
          </span>
        ) : null}
      </Card>

      {actionError ? (
        <Card elevated style={{ gap: 12 }}>
          <span className="typo-small text-error">{t("NO PUDIMOS COMPLETAR LA ACCIÓN", "WE COULDN'T COMPLETE THE ACTION")}</span>
          <p className="typo-body m-0 text-text-primary">{actionError.message}</p>
          {actionError.showPlansCta ? (
            <Link
              href="/profile#planes"
              className="typo-body font-bold text-primary-600 no-underline"
            >
              {t("Ver planes →", "View plans →")}
            </Link>
          ) : null}
        </Card>
      ) : null}

      {lastActionLeague ? (
        <ActionResultCard
          actionMessage={actionMessage}
          league={lastActionLeague}
          onOpenLeague={onSelectLeague}
          onDismiss={onDismissActionResult}
        />
      ) : null}

      {errorMessage ? (
        <ErrorCard message={errorMessage} onRetry={onRetry} />
      ) : null}

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

      {!isLoading && isGlobal && globalStandings && globalStandings.items.length > 0 ? (
        <>
          <GlobalStandingsTable standings={globalStandings} />
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
          <span className="typo-eyebrow">SIN COMPETENCIA ACTIVA</span>
          <p className="typo-body m-0 text-text-secondary">
            Cuando la liga tenga predicciones puntuadas vas a ver la tabla aqui.
          </p>
        </Card>
      ) : null}

      {!isLoading && isGlobal && globalStandings && globalStandings.items.length === 0 ? (
        <Card className="surface-inset" style={{ gap: 8, padding: 16 }}>
          <span className="typo-eyebrow">{t("SIN RANKING TODAVÍA", "NO RANKING YET")}</span>
          <p className="typo-body m-0 text-text-secondary">
            {t(
              "Cuando haya jugadores en ligas activas vas a ver el ranking global acá.",
              "When there are players in active leagues you'll see the global ranking here."
            )}
          </p>
        </Card>
      ) : null}

      {!isGlobal && selectedLeague?.inviteLink ? (
        <div>
          <ShareInviteButton
            leagueName={selectedLeague.name}
            inviteCode={selectedLeague.inviteCode}
            inviteLink={selectedLeague.inviteLink}
            shareLeagueId={selectedLeague.leagueId}
            variant="ghost"
          />
        </div>
      ) : null}

      {!isGlobal && selectedLeague ? (
        <div>
          <button
            type="button"
            onClick={() =>
              onRequestLeaveOrDelete(
                isOwnerOfSelected ? "delete" : "leave",
                selectedLeague.leagueId,
                selectedLeague.name
              )
            }
            className="w-full rounded-[var(--radius-md)] px-4 py-2.5 typo-body font-bold text-[var(--color-error,#DC2626)] border border-[var(--color-error,#DC2626)] bg-transparent hover:bg-[var(--color-error,#DC2626)] hover:text-white transition-colors"
          >
            {isOwnerOfSelected ? "Eliminar liga" : "Abandonar liga"}
          </button>
        </div>
      ) : null}

      {isGlobal ? (
        <div className="grid gap-3">
          {items.length > 0 ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="typo-eyebrow">{t("MIS LIGAS PRIVADAS", "MY PRIVATE LEAGUES")}</span>
              <div className="flex gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => onChangeMode(mode === "create" ? null : "create")}
                  className="leagues-text-action"
                >
                  {mode === "create" ? t("Cancelar", "Cancel") : t("+ Crear liga", "+ Create league")}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode(mode === "join" ? null : "join")}
                  className="leagues-text-action leagues-text-action--muted"
                >
                  {mode === "join" ? t("Cancelar", "Cancel") : t("Unirme", "Join")}
                </button>
              </div>
            </div>
          ) : null}

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

          {items.length === 0 && mode === null ? (
            <Card elevated style={{ gap: 12 }}>
              <h2 className="typo-h3 m-0 text-text-primary">{t("No estás en ninguna liga", "You're not in any league")}</h2>
              <p className="typo-body m-0 text-text-secondary">
                {t(
                  "Creá una o unite con un código para competir con colegas.",
                  "Create one or join with a code to compete with friends."
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="primary" onClick={() => onChangeMode("create")}>
                  {t("+ Crear liga", "+ Create league")}
                </Button>
                <Button variant="ghost" onClick={() => onChangeMode("join")}>
                  {t("Unirme", "Join")}
                </Button>
              </div>
            </Card>
          ) : null}

          {items.map((league) => (
            <Card
              key={league.leagueId}
              elevated
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle de ${league.name}`}
              onClick={() => onSelectLeague(league.leagueId)}
              onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectLeague(league.leagueId);
                }
              }}
              style={{ gap: 8, cursor: "pointer" }}
            >
              <div className="flex justify-between gap-2 items-start">
                <div className="grid gap-0.5 min-w-0">
                  <h3 className="typo-h3 m-0 text-text-primary truncate">{league.name}</h3>
                  <span className="text-[13px] leading-[1.35] font-medium text-text-secondary tabular-nums">
                    {league.position
                      ? t(`#${league.position} en la liga`, `#${league.position} in the league`)
                      : t("Sin puesto todavía", "No rank yet")}
                  </span>
                  <span className="text-[12px] leading-[1.35] text-text-muted tabular-nums">
                    {league.userPoints} pts · {league.membersCount} jugadores
                  </span>
                </div>
                {!league.isActive ? (
                  <StatusTag status="neutral" label="Cerrada" />
                ) : null}
              </div>
              {league.inviteLink ? (
                <div
                  className="flex gap-2 flex-wrap"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ShareInviteButton
                    leagueName={league.name}
                    inviteCode={league.inviteCode}
                    inviteLink={league.inviteLink}
                    shareLeagueId={league.leagueId}
                    variant="ghost"
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {isGlobal && !globalStandings?.items.length ? (
        <AdSlotCard
          description={copyForLocale(
            locale,
            "Espacio reservado para patrocinio nativo.",
            "Reserved slot for native sponsorship."
          )}
        />
      ) : null}
    </div>
  );
}

export function LeaguesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const { locale } = useLocale();
  const [items, setItems] = useState<LeagueSummary[]>([]);
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [standings, setStandings] = useState<LeagueStandingsResponse | null>(null);
  const [globalStandings, setGlobalStandings] = useState<GlobalStandingsResponse | null>(null);
  /*
   * selectedLeagueId is derived from the URL (single source of truth) so
   * that `router.replace` on chip click drives the re-render. Previously
   * we used useState + a sync useEffect, which caused a race: setState ran
   * with the fresh value but the sync effect re-read a stale searchParams
   * and reverted the state, forcing the user to click Global twice.
   */
  const selectedLeagueId = searchParams.get("leagueId") ?? GLOBAL_LEAGUE_ID;
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [formState, setFormState] = useState({
    leagueName: "",
    inviteCode: ""
  });
  const [actionError, setActionError] = useState<ActionErrorState>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastActionLeague, setLastActionLeague] = useState<LeagueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: LeagueConfirmAction;
    leagueId: string;
    leagueName: string;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const isOwnerOfSelected = standings?.items.find((entry) => entry.isMe)?.isOwner ?? false;

  // Auto-limpia el card de "liga creada/joineada" cuando el user navega a otra liga.
  useEffect(() => {
    setLastActionLeague(null);
    setActionMessage(null);
  }, [selectedLeagueId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setPoints(null);
        setStandings(null);
        setGlobalStandings(null);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [leaguesResponse, pointsResponse] = await Promise.all([getMyLeagues(token), getPoints(token)]);

        const isPrivateLeague = selectedLeagueId !== GLOBAL_LEAGUE_ID;
        let standingsResponse: LeagueStandingsResponse | null = null;
        let globalStandingsResponse: GlobalStandingsResponse | null = null;
        let leagueUnavailable = false;

        if (isPrivateLeague) {
          try {
            standingsResponse = await getLeagueStandings(token, selectedLeagueId);
          } catch (standingsError) {
            // Stale ?leagueId=... in URL pointing to a deleted league or one
            // the user was removed from. Fall back to Global silently instead
            // of blanking the whole screen.
            if (
              standingsError instanceof ApiClientError &&
              (standingsError.status === 404 || standingsError.status === 403)
            ) {
              leagueUnavailable = true;
            } else {
              throw standingsError;
            }
          }
        } else {
          globalStandingsResponse = await getGlobalStandings(token);
        }

        if (!cancelled) {
          setItems(leaguesResponse.items);
          setPoints(pointsResponse);
          setStandings(standingsResponse);
          setGlobalStandings(globalStandingsResponse);
          if (leagueUnavailable) {
            router.replace("/leagues");
          }
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
      setActionError({ message: "No encontramos una sesion activa." });
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
      if (error instanceof ApiClientError && error.code === "USER_LEAGUE_LIMIT_REACHED") {
        setActionError({ message: userLeagueLimitCopy(locale), showPlansCta: true });
      } else {
        setActionError({
          message: error instanceof ApiClientError ? error.message : "No pudimos crear la liga."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinLeague(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setActionError({ message: "No encontramos una sesion activa." });
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
      if (error instanceof ApiClientError && error.code === "USER_LEAGUE_LIMIT_REACHED") {
        setActionError({ message: userLeagueLimitCopy(locale), showPlansCta: true });
      } else if (error instanceof ApiClientError && error.code === "LEAGUE_CAPACITY_REACHED") {
        setActionError({ message: leagueCapacityCopy(locale), showPlansCta: true });
      } else {
        setActionError({
          message: error instanceof ApiClientError ? error.message : "No pudimos unirte a la liga."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRequestLeaveOrDelete(action: LeagueConfirmAction, leagueId: string, leagueName: string) {
    setConfirmDialog({ action, leagueId, leagueName });
  }

  async function handleConfirmDialog() {
    if (!confirmDialog || !user) {
      return;
    }

    setIsConfirming(true);
    setActionError(null);

    try {
      const token = await user.getIdToken();
      if (confirmDialog.action === "leave") {
        await leaveLeague(token, confirmDialog.leagueId);
        track("league_left", { leagueId: confirmDialog.leagueId });
      } else {
        await deleteLeague(token, confirmDialog.leagueId);
        track("league_deleted", { leagueId: confirmDialog.leagueId });
      }
      setConfirmDialog(null);
      setLastActionLeague(null);
      router.replace("/leagues");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError({
        message: error instanceof ApiClientError ? error.message : copyForLocale(locale, "No pudimos completar la acción.", "We couldn't complete the action.")
      });
      setConfirmDialog(null);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <LeaguesScreenView
        items={items}
        points={points}
        standings={standings}
        globalStandings={globalStandings}
        selectedLeagueId={selectedLeagueId}
        mode={mode}
        formState={formState}
        actionError={actionError}
        actionMessage={actionMessage}
        lastActionLeague={lastActionLeague}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        isOwnerOfSelected={isOwnerOfSelected}
        errorMessage={errorMessage}
        onChangeMode={(nextMode) => {
          setMode(nextMode);
          setActionError(null);
        }}
        onFieldChange={handleFieldChange}
        onCreateLeague={handleCreateLeague}
        onJoinLeague={handleJoinLeague}
        onSelectLeague={(leagueId) => {
          if (leagueId === GLOBAL_LEAGUE_ID) {
            router.replace("/leagues");
          } else {
            router.replace(`/leagues?leagueId=${leagueId}`);
          }
        }}
        onRequestLeaveOrDelete={handleRequestLeaveOrDelete}
        onDismissActionResult={() => {
          setLastActionLeague(null);
          setActionMessage(null);
        }}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
      <LeagueConfirmModal
        isOpen={confirmDialog !== null}
        action={confirmDialog?.action ?? "leave"}
        leagueName={confirmDialog?.leagueName ?? ""}
        isSubmitting={isConfirming}
        onConfirm={handleConfirmDialog}
        onCancel={() => setConfirmDialog(null)}
      />
    </>
  );
}
