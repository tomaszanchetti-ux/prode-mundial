"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  BestPlayerPickResponse,
  ChampionPickResponse,
  MacroPickWarning,
  SubChampionPickResponse,
  TournamentPickWindow,
  TournamentProjectionResponse
} from "@prode/shared";
import {
  APP_ROUTES,
  BEST_PLAYER_ROSTER,
  PICK_WINDOW_POINT_VALUES,
  detectMacroPickWarnings,
  getBestPlayerById,
  resolveAliveTeamsAfterGroups,
  resolveTeamIdentity
} from "@prode/shared";
import { Button, Card, ErrorCard, SkeletonCard, StatusTag, TeamIdentity } from "@prode/ui";
import type { StatusTone } from "@prode/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { copyForLocale, useLocale, type AppLocale } from "@/lib/i18n/locale-provider";
import {
  ApiClientError,
  adjustBestPlayerPick,
  adjustChampionPick,
  adjustSubChampionPick,
  getBestPlayerPick,
  getChampionPick,
  getSubChampionPick,
  getTournamentProjection,
  saveBestPlayerPick,
  saveChampionPick,
  saveSubChampionPick
} from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { WORLD_CUP_2026_OFFICIAL_GROUPS } from "@/lib/world-cup/groups";
import { PickableList, type PickableListItem } from "@/components/tournament/pickable-list";
import { PlayerPickableList } from "@/components/tournament/player-pickable-list";

type PickTab = "champion" | "sub-champion" | "best-player";

const TABS: { id: PickTab; es: string; en: string }[] = [
  { id: "champion", es: "Campeón", en: "Champion" },
  { id: "sub-champion", es: "Sub-Campeón", en: "Runner-up" },
  { id: "best-player", es: "Balón de Oro", en: "Golden Ball" }
];

const ALL_TEAMS: PickableListItem[] = WORLD_CUP_2026_OFFICIAL_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    groupId: group.groupId
  }))
);

function resolveTeamData(teamId: string) {
  const identity = resolveTeamIdentity(teamId);
  const entry = ALL_TEAMS.find((t) => t.teamId === teamId);

  return {
    fifaCode: identity.fifaCode,
    flagAsset: identity.flagAsset,
    flagUrl: identity.flagUrl,
    name: entry?.teamName ?? teamId
  };
}

function resolveStatusMeta(
  status: ChampionPickResponse["status"] | null | undefined,
  locale: AppLocale
): {
  label: string;
  tone: StatusTone;
} {
  switch (status) {
    case "picked":
      return { label: copyForLocale(locale, "Guardado", "Saved"), tone: "saved" };
    case "locked":
      return { label: copyForLocale(locale, "Bloqueado", "Locked"), tone: "neutral" };
    case "adjustment_available":
      return { label: copyForLocale(locale, "Ajuste disponible", "Adjustment available"), tone: "live" };
    case "adjusted":
      return { label: copyForLocale(locale, "Ajustado", "Adjusted"), tone: "neutral" };
    case "scored":
      return { label: copyForLocale(locale, "Puntuado", "Scored"), tone: "scored" };
    case "empty":
    default:
      return { label: copyForLocale(locale, "Pendiente", "Pending"), tone: "editable" };
  }
}

function formatRemaining(closesAtMs: number, nowMs: number): string | null {
  const diffMs = closesAtMs - nowMs;
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function useTicker(intervalMs = 60_000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

type WindowChipProps = {
  pickWindow: TournamentPickWindow;
  pointValue: number;
  closesAt: string | null;
};

function WindowChip({ pickWindow, pointValue, closesAt }: WindowChipProps) {
  const { locale } = useLocale();
  const nowMs = useTicker();
  if (pickWindow === "closed") {
    return <StatusTag status="neutral" label={copyForLocale(locale, "Ventana cerrada", "Window closed")} />;
  }
  const remaining = closesAt ? formatRemaining(new Date(closesAt).getTime(), nowMs) : null;
  const labelBase =
    pickWindow === "A"
      ? copyForLocale(locale, `Ventana A · ${pointValue} pts`, `Window A · ${pointValue} pts`)
      : copyForLocale(locale, `Ventana B · ${pointValue} pts`, `Window B · ${pointValue} pts`);
  const label = remaining
    ? copyForLocale(locale, `${labelBase} · cierra en ${remaining}`, `${labelBase} · closes in ${remaining}`)
    : labelBase;
  return <StatusTag status={pickWindow === "A" ? "live" : "closing-soon"} label={label} />;
}

// ── Warning banner ──────────────────────────────────────

type WarningBannerProps = {
  title: string;
  message: string;
};

function WarningBanner({ title, message }: WarningBannerProps) {
  return (
    <div className="grid gap-1 p-3 rounded-md alert-warning">
      <strong className="text-[14px]">{title}</strong>
      <p className="m-0 text-[13px] leading-[1.45]">{message}</p>
    </div>
  );
}

// ── Tab headers ─────────────────────────────────────────

type TabsBarProps = {
  activeTab: PickTab;
  onSelect: (tab: PickTab) => void;
};

function TabsBar({ activeTab, onSelect }: TabsBarProps) {
  const { locale } = useLocale();
  return (
    <div
      className="flex gap-1.5 overflow-x-auto filter-bar-bg px-[2px]"
      role="tablist"
      aria-label={copyForLocale(locale, "Tipos de picks", "Pick types")}
    >
      {TABS.map((t) => {
        const isActive = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(t.id)}
            className={`filter-chip whitespace-nowrap ${
              isActive ? "filter-chip-active" : "filter-chip-inactive"
            }`}
          >
            {copyForLocale(locale, t.es, t.en)}
          </button>
        );
      })}
    </div>
  );
}

// ── Screen ──────────────────────────────────────────────

export function PicksScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as PickTab | null) ?? "champion";
  const { status, user } = useAuth();
  const { locale } = useLocale();
  const t = (es: string, en: string) => copyForLocale(locale, es, en);

  const [activeTab, setActiveTab] = useState<PickTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "champion"
  );
  const [championPick, setChampionPick] = useState<ChampionPickResponse | null>(null);
  const [subChampionPick, setSubChampionPick] = useState<SubChampionPickResponse | null>(null);
  const [bestPlayerPick, setBestPlayerPick] = useState<BestPlayerPickResponse | null>(null);
  const [projection, setProjection] = useState<TournamentProjectionResponse | null>(null);

  const [championSelected, setChampionSelected] = useState<string | null>(null);
  const [subChampionSelected, setSubChampionSelected] = useState<string | null>(null);
  const [bestPlayerSelected, setBestPlayerSelected] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      if (status !== "authenticated" || !user) {
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [nextChampion, nextSub, nextBestPlayer, nextProjection] = await Promise.all([
          getChampionPick(token),
          getSubChampionPick(token),
          getBestPlayerPick(token),
          getTournamentProjection(token).catch(() => null)
        ]);

        if (!cancelled) {
          setChampionPick(nextChampion);
          setSubChampionPick(nextSub);
          setBestPlayerPick(nextBestPlayer);
          setProjection(nextProjection);
          setChampionSelected(nextChampion.adjustedChampionTeamId ?? nextChampion.championTeamId);
          setSubChampionSelected(nextSub.adjustedSubChampionTeamId ?? nextSub.subChampionTeamId);
          setBestPlayerSelected(nextBestPlayer.adjustedBestPlayerId ?? nextBestPlayer.bestPlayerId);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : t("No pudimos cargar tus picks.", "We couldn't load your picks.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  function switchTab(next: PickTab) {
    setActiveTab(next);
    setErrorMessage(null);
    setFeedbackMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${APP_ROUTES.picks}?${params.toString()}`, { scroll: false });
  }

  async function handleSaveChampion() {
    if (!user || !championSelected) return;
    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const token = await user.getIdToken();
      const isAdjustment = championPick?.status === "adjustment_available";
      if (isAdjustment) {
        const response = await adjustChampionPick(token, { championTeamId: championSelected });
        setFeedbackMessage(response.penaltyNotice);
      } else {
        await saveChampionPick(token, { championTeamId: championSelected });
        setFeedbackMessage(t("Mi campeón quedó guardado.", "Your champion was saved."));
      }
      track("champion_saved", {
        teamId: championSelected,
        pickWindow: championPick?.pickWindow ?? null,
        isAdjustment
      });
      setReloadKey((k) => k + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("No pudimos guardar tu campeón.", "We couldn't save your champion.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSubChampion() {
    if (!user || !subChampionSelected) return;
    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const token = await user.getIdToken();
      const isAdjustment = subChampionPick?.status === "adjustment_available";
      if (isAdjustment) {
        const response = await adjustSubChampionPick(token, { subChampionTeamId: subChampionSelected });
        setFeedbackMessage(response.penaltyNotice);
      } else {
        await saveSubChampionPick(token, { subChampionTeamId: subChampionSelected });
        setFeedbackMessage(t("Mi sub-campeón quedó guardado.", "Your runner-up was saved."));
      }
      track("sub_champion_saved", {
        teamId: subChampionSelected,
        pickWindow: subChampionPick?.pickWindow ?? null,
        isAdjustment
      });
      setReloadKey((k) => k + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("No pudimos guardar tu sub-campeón.", "We couldn't save your runner-up.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveBestPlayer() {
    if (!user || !bestPlayerSelected) return;
    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const token = await user.getIdToken();
      const isAdjustment = bestPlayerPick?.status === "adjustment_available";
      if (isAdjustment) {
        const response = await adjustBestPlayerPick(token, { bestPlayerId: bestPlayerSelected });
        setFeedbackMessage(response.penaltyNotice);
      } else {
        await saveBestPlayerPick(token, { bestPlayerId: bestPlayerSelected });
        setFeedbackMessage(t("Mi Balón de Oro quedó guardado.", "Your Golden Ball was saved."));
      }
      track("best_player_saved", {
        playerId: bestPlayerSelected,
        pickWindow: bestPlayerPick?.pickWindow ?? null,
        isAdjustment
      });
      setReloadKey((k) => k + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("No pudimos guardar tu Balón de Oro.", "We couldn't save your Golden Ball.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Champion tab derived state
  const championStatusMeta = resolveStatusMeta(championPick?.status, locale);
  const championCanEdit = championPick?.status === "empty" || championPick?.status === "picked";
  const championCanAdjust = championPick?.status === "adjustment_available";
  const championInteractive = championCanEdit || championCanAdjust;
  const championPersistedId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const championSaveDisabled =
    isSaving || !championSelected || championSelected === championPersistedId;

  // Sub-champion tab derived state
  const subStatusMeta = resolveStatusMeta(subChampionPick?.status, locale);
  const subCanEdit = subChampionPick?.status === "empty" || subChampionPick?.status === "picked";
  const subCanAdjust = subChampionPick?.status === "adjustment_available";
  const subInteractive = subCanEdit || subCanAdjust;
  const subPersistedId =
    subChampionPick?.adjustedSubChampionTeamId ?? subChampionPick?.subChampionTeamId ?? null;
  const subSaveDisabled =
    isSaving || !subChampionSelected || subChampionSelected === subPersistedId;

  // Best-player tab derived state
  const bestPlayerStatusMeta = resolveStatusMeta(bestPlayerPick?.status, locale);
  const bestPlayerCanEdit = bestPlayerPick?.status === "empty" || bestPlayerPick?.status === "picked";
  const bestPlayerCanAdjust = bestPlayerPick?.status === "adjustment_available";
  const bestPlayerInteractive = bestPlayerCanEdit || bestPlayerCanAdjust;
  const bestPlayerPersistedId =
    bestPlayerPick?.adjustedBestPlayerId ?? bestPlayerPick?.bestPlayerId ?? null;
  const bestPlayerSaveDisabled =
    isSaving || !bestPlayerSelected || bestPlayerSelected === bestPlayerPersistedId;

  const championTeamId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const hasChampion = !!championTeamId;
  const bestPlayerTeamId = bestPlayerPersistedId ? getBestPlayerById(bestPlayerPersistedId)?.teamId ?? null : null;

  // Alive set — only applied in window B when the bracket is actually hydrated
  // from finalized groups. In window A the set is a projection from the user's
  // predictions, so we don't disable teams based on it.
  const aliveTeams = useMemo(() => {
    if (!projection?.bracket) return new Set<string>();
    if (championPick?.pickWindow !== "B") return new Set<string>();
    return resolveAliveTeamsAfterGroups(projection.bracket);
  }, [projection, championPick?.pickWindow]);

  // Champion disabled items — only eliminated teams in window B (hard-block on
  // adjust, warning on saved-but-stale picks).
  const championDisabledItems = useMemo(() => {
    const set = new Set<string>();
    if (!championCanAdjust) return set;
    if (aliveTeams.size === 0) return set;
    for (const team of ALL_TEAMS) {
      if (!aliveTeams.has(team.teamId)) set.add(team.teamId);
    }
    return set;
  }, [championCanAdjust, aliveTeams]);

  // Sub-champion disabled items — cross-uniqueness (champion team) + eliminated
  // in window B. Same-half is NO LONGER disabled (soft warning only, EPIC 19).
  const subDisabledItems = useMemo(() => {
    const set = new Set<string>();
    if (championTeamId) set.add(championTeamId);
    if (subCanAdjust && aliveTeams.size > 0) {
      for (const team of ALL_TEAMS) {
        if (!aliveTeams.has(team.teamId)) set.add(team.teamId);
      }
    }
    return set;
  }, [championTeamId, subCanAdjust, aliveTeams]);

  // Best-player disabled items — players whose team was eliminated in groups.
  const bestPlayerDisabledItems = useMemo(() => {
    const set = new Set<string>();
    if (!bestPlayerCanAdjust) return set;
    if (aliveTeams.size === 0) return set;
    for (const player of BEST_PLAYER_ROSTER) {
      if (!aliveTeams.has(player.teamId)) set.add(player.playerId);
    }
    return set;
  }, [bestPlayerCanAdjust, aliveTeams]);

  // Warnings — pure detector from shared. Emitted even pre-groups-closed for
  // same_half (structural); eliminated warnings only show once groups close.
  const warnings: MacroPickWarning[] = useMemo(() => {
    if (!projection?.bracket) return [];
    const areGroupsOfficiallyClosed = championPick?.pickWindow === "B";
    return detectMacroPickWarnings({
      bracket: projection.bracket,
      championTeamId,
      subChampionTeamId: subPersistedId,
      bestPlayerTeamId,
      areGroupsOfficiallyClosed
    });
  }, [projection, championPick?.pickWindow, championTeamId, subPersistedId, bestPlayerTeamId]);

  const hasSameHalfWarning = warnings.some((w) => w.kind === "same_half");
  const hasChampionEliminatedWarning = warnings.some((w) => w.kind === "champion_eliminated");
  const hasSubChampionEliminatedWarning = warnings.some((w) => w.kind === "sub_champion_eliminated");
  const hasBestPlayerEliminatedWarning = warnings.some((w) => w.kind === "best_player_eliminated");

  const eliminatedTeamMessage = t(
    "El equipo que elegiste no pasó de grupos. Ajustá tu pick para sumar 10 pts.",
    "The team you picked didn't make it past the group stage. Adjust your pick to score 10 pts."
  );
  const sameHalfMessage = t(
    "Tu campeón y sub-campeón quedaron en la misma mitad del bracket: solo uno puede llegar a la final. Podés ajustar alguno.",
    "Your champion and runner-up landed in the same half of the bracket: only one can reach the final. You can adjust either one."
  );
  const adjustWindowTitle = t("Ventana de ajuste abierta", "Adjustment window open");
  const savingLabel = t("Guardando...", "Saving...");
  const adjustLabel = t("Ajustar", "Adjust");
  const saveLabel = t("Guardar", "Save");

  return (
    <div className="grid gap-4">
      <Link
        href={APP_ROUTES.tournament}
        className="inline-flex items-center gap-1.5 text-[13px] leading-none font-medium text-text-muted hover:text-text-primary transition-colors no-underline w-fit"
      >
        <span aria-hidden="true">←</span>
        <span>{t("Volver a Predicciones", "Back to Predictions")}</span>
      </Link>

      <Card elevated className="hero-worldcup-bg" style={{ gap: 8, padding: 20 }}>
        <div className="flex items-center gap-3">
          <Image
            src="/mundial/wc2026-logo.png"
            alt=""
            width={32}
            height={32}
            className="opacity-70"
            priority
          />
          <span className="typo-eyebrow">{t("MIS PICKS", "MY PICKS")}</span>
        </div>
        <h1 className="typo-h2 m-0 text-text-primary">
          {t(
            "Elegí al Campeón, Sub-Campeón y Balón de Oro.",
            "Pick your Champion, Runner-up and Golden Ball."
          )}
        </h1>
        <p className="m-0 text-[13px] leading-[1.45] text-text-secondary">
          {t(
            `${PICK_WINDOW_POINT_VALUES.A} pts por acierto inicial · ${PICK_WINDOW_POINT_VALUES.B} pts si ajustás post-grupos.`,
            `${PICK_WINDOW_POINT_VALUES.A} pts for an initial correct pick · ${PICK_WINDOW_POINT_VALUES.B} pts if you adjust after the group stage.`
          )}
        </p>
      </Card>

      <TabsBar activeTab={activeTab} onSelect={switchTab} />

      {isLoading ? <SkeletonCard lines={3} /> : null}

      {feedbackMessage ? (
        <div className="grid gap-2 p-4 rounded-md alert-info">
          <strong className="text-[16px]">{t("Listo", "Done")}</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{feedbackMessage}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard
          title={t("No pudimos procesar tu pick", "We couldn't process your pick")}
          message={errorMessage}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {/* Champion tab */}
      {activeTab === "champion" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-eyebrow">{t("MI CAMPEÓN", "MY CHAMPION")}</span>
            <StatusTag status={championStatusMeta.tone} label={championStatusMeta.label} />
          </div>
          {championPick ? (
            <WindowChip
              pickWindow={championPick.pickWindow}
              pointValue={championPick.pickWindowPointValue}
              closesAt={championPick.pickWindowClosesAt}
            />
          ) : null}

          {hasChampionEliminatedWarning ? (
            <WarningBanner
              title={t("Tu campeón fue eliminado", "Your champion is out")}
              message={eliminatedTeamMessage}
            />
          ) : null}

          {hasSameHalfWarning ? (
            <WarningBanner
              title={t("Cruce temprano con tu sub-campeón", "Early clash with your runner-up")}
              message={sameHalfMessage}
            />
          ) : null}

          {championCanAdjust ? (
            <div className="grid gap-1 p-3 rounded-md alert-info">
              <strong className="text-[14px]">{adjustWindowTitle}</strong>
              <p className="m-0 text-[13px] leading-[1.45]">
                {t(
                  "Podés cambiar tu campeón, pero si acertás sumás 10 pts en vez de 20.",
                  "You can change your champion, but a correct pick now scores 10 pts instead of 20."
                )}
              </p>
            </div>
          ) : null}

          {championInteractive ? (
            <PickableList
              items={ALL_TEAMS}
              selectedTeamId={championSelected}
              onSelect={(teamId) => setChampionSelected(teamId)}
              disabledItems={championDisabledItems}
              disabledHint={t("eliminado", "eliminated")}
            />
          ) : championPersistedId ? (
            <div className="flex items-center gap-3">
              <TeamIdentity team={resolveTeamData(championPersistedId)} size="lg" showFlag showName emphasis="hero" />
            </div>
          ) : null}

          {championInteractive ? (
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveChampion()} disabled={championSaveDisabled}>
                {isSaving ? savingLabel : championCanAdjust ? adjustLabel : saveLabel}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Sub-Champion tab */}
      {activeTab === "sub-champion" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-eyebrow">{t("MI SUB-CAMPEÓN", "MY RUNNER-UP")}</span>
            <StatusTag status={subStatusMeta.tone} label={subStatusMeta.label} />
          </div>
          {subChampionPick ? (
            <WindowChip
              pickWindow={subChampionPick.pickWindow}
              pointValue={subChampionPick.pickWindowPointValue}
              closesAt={subChampionPick.pickWindowClosesAt}
            />
          ) : null}

          {hasSubChampionEliminatedWarning ? (
            <WarningBanner
              title={t("Tu sub-campeón fue eliminado", "Your runner-up is out")}
              message={eliminatedTeamMessage}
            />
          ) : null}

          {hasSameHalfWarning ? (
            <WarningBanner
              title={t("Cruce temprano con tu campeón", "Early clash with your champion")}
              message={sameHalfMessage}
            />
          ) : null}

          {subInteractive && !hasChampion ? (
            <div className="grid gap-2 p-3 rounded-md alert-info">
              <p className="m-0 text-[13px] leading-[1.45]">
                {t("Elegí tu campeón primero.", "Pick your champion first.")}
              </p>
              <div>
                <Button variant="secondary" onClick={() => switchTab("champion")}>
                  {t("Elegir campeón", "Pick champion")}
                </Button>
              </div>
            </div>
          ) : null}

          {subCanAdjust ? (
            <div className="grid gap-1 p-3 rounded-md alert-info">
              <strong className="text-[14px]">{adjustWindowTitle}</strong>
              <p className="m-0 text-[13px] leading-[1.45]">
                {t(
                  "Podés cambiar tu sub-campeón. Si comparte mitad con el campeón verás un aviso, pero el pick se guarda igual.",
                  "You can change your runner-up. If it shares a half with your champion you'll see a warning, but the pick is saved anyway."
                )}
              </p>
            </div>
          ) : null}

          {subInteractive && hasChampion ? (
            <PickableList
              items={ALL_TEAMS}
              selectedTeamId={subChampionSelected}
              onSelect={(teamId) => setSubChampionSelected(teamId)}
              disabledItems={subDisabledItems}
              disabledHint={
                subCanAdjust
                  ? t("eliminado / campeón", "eliminated / champion")
                  : t("es tu campeón", "your champion")
              }
            />
          ) : !subInteractive && subPersistedId ? (
            <div className="flex items-center gap-3">
              <TeamIdentity team={resolveTeamData(subPersistedId)} size="lg" showFlag showName emphasis="hero" />
            </div>
          ) : null}

          {subInteractive && hasChampion ? (
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveSubChampion()} disabled={subSaveDisabled}>
                {isSaving ? savingLabel : subCanAdjust ? adjustLabel : saveLabel}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Best-Player tab */}
      {activeTab === "best-player" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-eyebrow">{t("MI BALÓN DE ORO", "MY GOLDEN BALL")}</span>
            <StatusTag status={bestPlayerStatusMeta.tone} label={bestPlayerStatusMeta.label} />
          </div>
          {bestPlayerPick ? (
            <WindowChip
              pickWindow={bestPlayerPick.pickWindow}
              pointValue={bestPlayerPick.pickWindowPointValue}
              closesAt={bestPlayerPick.pickWindowClosesAt}
            />
          ) : null}

          {hasBestPlayerEliminatedWarning ? (
            <WarningBanner
              title={t("El equipo de tu jugador fue eliminado", "Your player's team is out")}
              message={t(
                "El jugador que elegiste quedó fuera del torneo. Ajustá tu pick para sumar 10 pts.",
                "The player you picked is out of the tournament. Adjust your pick to score 10 pts."
              )}
            />
          ) : null}

          {bestPlayerCanAdjust ? (
            <div className="grid gap-1 p-3 rounded-md alert-info">
              <strong className="text-[14px]">{adjustWindowTitle}</strong>
              <p className="m-0 text-[13px] leading-[1.45]">
                {t(
                  "Podés cambiar tu Balón de Oro, pero si acertás sumás 10 pts en vez de 20.",
                  "You can change your Golden Ball, but a correct pick now scores 10 pts instead of 20."
                )}
              </p>
            </div>
          ) : null}

          <p className="m-0 text-[13px] leading-[1.45] text-text-secondary">
            {t(
              "Roster provisional — cuando FIFA publique la nómina oficial vamos a sincronizar los jugadores.",
              "Provisional roster — once FIFA publishes the official squad lists we'll sync the players."
            )}
          </p>

          {bestPlayerInteractive ? (
            <PlayerPickableList
              items={BEST_PLAYER_ROSTER}
              selectedPlayerId={bestPlayerSelected}
              onSelect={(playerId) => setBestPlayerSelected(playerId)}
              disabledItems={bestPlayerDisabledItems}
              disabledHint={t("equipo eliminado", "team eliminated")}
            />
          ) : bestPlayerPersistedId ? (
            <BestPlayerSummary playerId={bestPlayerPersistedId} />
          ) : null}

          {bestPlayerInteractive ? (
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveBestPlayer()} disabled={bestPlayerSaveDisabled}>
                {isSaving ? savingLabel : bestPlayerCanAdjust ? adjustLabel : saveLabel}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function BestPlayerSummary({ playerId }: { playerId: string }) {
  const { locale } = useLocale();
  const player = getBestPlayerById(playerId);
  if (!player) {
    return (
      <p className="m-0 text-[13px] text-text-muted">
        {copyForLocale(locale, "Jugador no disponible en el roster actual.", "Player not available in the current roster.")}
      </p>
    );
  }
  const identity = resolveTeamIdentity(player.teamId);
  return (
    <div className="flex items-center gap-3">
      <TeamIdentity
        team={{
          teamName: player.teamId,
          fifaCode: identity.fifaCode,
          flagAsset: identity.flagAsset,
          flagUrl: identity.flagUrl
        }}
        size="lg"
        showFlag
        showName={false}
        emphasis="hero"
      />
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold text-text-primary">{player.name}</span>
        <span className="text-[13px] text-text-muted">{player.club} · {player.position}</span>
      </div>
    </div>
  );
}
