"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  ChampionPickResponse,
  SubChampionPickResponse,
  TournamentPickWindow,
  TournamentProjectionResponse
} from "@prode/shared";
import { APP_ROUTES, classifyTeamBracketHalves, resolveTeamIdentity } from "@prode/shared";
import { Button, Card, ErrorCard, SkeletonCard, StatusTag, TeamIdentity } from "@prode/ui";
import type { StatusTone } from "@prode/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ApiClientError,
  adjustChampionPick,
  adjustSubChampionPick,
  getChampionPick,
  getSubChampionPick,
  getTournamentProjection,
  saveChampionPick,
  saveSubChampionPick
} from "@/lib/api/client";
import { track } from "@/lib/firebase/analytics";
import { WORLD_CUP_2026_OFFICIAL_GROUPS } from "@/lib/world-cup/groups";
import { PickableList, type PickableListItem } from "@/components/tournament/pickable-list";

type PickTab = "champion" | "sub-champion" | "best-player";

const TABS: { id: PickTab; label: string }[] = [
  { id: "champion", label: "Campeón" },
  { id: "sub-champion", label: "Sub-Campeón" },
  { id: "best-player", label: "Balón de Oro" }
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

function resolveStatusMeta(status: ChampionPickResponse["status"] | null | undefined): {
  label: string;
  tone: StatusTone;
} {
  switch (status) {
    case "picked":
      return { label: "Guardado", tone: "saved" };
    case "locked":
      return { label: "Bloqueado", tone: "neutral" };
    case "adjustment_available":
      return { label: "Ajuste disponible", tone: "live" };
    case "adjusted":
      return { label: "Ajustado", tone: "neutral" };
    case "scored":
      return { label: "Puntuado", tone: "scored" };
    case "empty":
    default:
      return { label: "Pendiente", tone: "editable" };
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
  const nowMs = useTicker();
  if (pickWindow === "closed") {
    return <StatusTag status="neutral" label="Ventana cerrada" />;
  }
  const remaining = closesAt ? formatRemaining(new Date(closesAt).getTime(), nowMs) : null;
  const labelBase = pickWindow === "A" ? `Ventana A · ${pointValue} pts` : `Ventana B · ${pointValue} pts`;
  const label = remaining ? `${labelBase} · cierra en ${remaining}` : labelBase;
  return <StatusTag status={pickWindow === "A" ? "live" : "closing-soon"} label={label} />;
}

// ── Tab headers ─────────────────────────────────────────

type TabsBarProps = {
  activeTab: PickTab;
  onSelect: (tab: PickTab) => void;
};

function TabsBar({ activeTab, onSelect }: TabsBarProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto filter-bar-bg px-[2px]"
      role="tablist"
      aria-label="Tipos de picks"
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
            {t.label}
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

  const [activeTab, setActiveTab] = useState<PickTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "champion"
  );
  const [championPick, setChampionPick] = useState<ChampionPickResponse | null>(null);
  const [subChampionPick, setSubChampionPick] = useState<SubChampionPickResponse | null>(null);
  const [projection, setProjection] = useState<TournamentProjectionResponse | null>(null);

  const [championSelected, setChampionSelected] = useState<string | null>(null);
  const [subChampionSelected, setSubChampionSelected] = useState<string | null>(null);

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
        const [nextChampion, nextSub, nextProjection] = await Promise.all([
          getChampionPick(token),
          getSubChampionPick(token),
          getTournamentProjection(token).catch(() => null)
        ]);

        if (!cancelled) {
          setChampionPick(nextChampion);
          setSubChampionPick(nextSub);
          setProjection(nextProjection);
          setChampionSelected(nextChampion.adjustedChampionTeamId ?? nextChampion.championTeamId);
          setSubChampionSelected(nextSub.adjustedSubChampionTeamId ?? nextSub.subChampionTeamId);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No pudimos cargar tus picks."
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
        setFeedbackMessage("Mi campeón quedó guardado.");
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
            : "No pudimos guardar tu campeón."
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
        setFeedbackMessage("Mi sub-campeón quedó guardado.");
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
            : "No pudimos guardar tu sub-campeón."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Champion tab derived state
  const championStatusMeta = resolveStatusMeta(championPick?.status);
  const championCanEdit = championPick?.status === "empty" || championPick?.status === "picked";
  const championCanAdjust = championPick?.status === "adjustment_available";
  const championInteractive = championCanEdit || championCanAdjust;
  const championPersistedId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const championSaveDisabled =
    isSaving || !championSelected || championSelected === championPersistedId;

  // Sub-champion tab derived state
  const subStatusMeta = resolveStatusMeta(subChampionPick?.status);
  const subCanEdit = subChampionPick?.status === "empty" || subChampionPick?.status === "picked";
  const subCanAdjust = subChampionPick?.status === "adjustment_available";
  const subInteractive = subCanEdit || subCanAdjust;
  const subPersistedId =
    subChampionPick?.adjustedSubChampionTeamId ?? subChampionPick?.subChampionTeamId ?? null;
  const subSaveDisabled =
    isSaving || !subChampionSelected || subChampionSelected === subPersistedId;

  const championTeamId = championPick?.adjustedChampionTeamId ?? championPick?.championTeamId ?? null;
  const hasChampion = !!championTeamId;

  // Disabled set for Sub-Champion PickableList — only enforced in window B
  // (post-groups adjustment). Window A is a 25-pt blind bet, no gating.
  const subDisabledItems = useMemo(() => {
    const set = new Set<string>();
    if (!championTeamId) return set;
    set.add(championTeamId);
    if (subChampionPick?.pickWindow === "B" && projection?.bracket) {
      const halves = classifyTeamBracketHalves(projection.bracket);
      const championHalf = halves.get(championTeamId);
      if (championHalf && championHalf !== "neutral") {
        for (const [teamId, half] of halves) {
          if (half === championHalf) set.add(teamId);
        }
      }
    }
    return set;
  }, [championTeamId, projection, subChampionPick?.pickWindow]);

  return (
    <div className="grid gap-4">
      <Card elevated className="hero-worldcup-bg" style={{ gap: 8, padding: 20 }}>
        <div className="flex items-center gap-3">
          <img src="/mundial/wc2026-logo.png" alt="" width={32} height={32} className="opacity-70" />
          <span className="typo-small text-text-muted">MIS PICKS</span>
        </div>
        <h1 className="typo-h2 m-0 text-text-primary">Elegí al Campeón, Sub-Campeón y Balón de Oro.</h1>
        <p className="m-0 text-[13px] leading-[1.45] text-text-secondary">
          25 pts por acierto inicial · 10 pts si ajustás post-grupos.
        </p>
      </Card>

      <TabsBar activeTab={activeTab} onSelect={switchTab} />

      {isLoading ? <SkeletonCard lines={3} /> : null}

      {feedbackMessage ? (
        <div className="grid gap-2 p-4 rounded-md alert-info">
          <strong className="text-[16px]">Listo</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{feedbackMessage}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard
          title="No pudimos procesar tu pick"
          message={errorMessage}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {/* Champion tab */}
      {activeTab === "champion" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-small text-text-muted">MI CAMPEÓN</span>
            <StatusTag status={championStatusMeta.tone} label={championStatusMeta.label} />
          </div>
          {championPick ? (
            <WindowChip
              pickWindow={championPick.pickWindow}
              pointValue={championPick.pickWindowPointValue}
              closesAt={championPick.pickWindowClosesAt}
            />
          ) : null}

          {championCanAdjust ? (
            <div className="grid gap-1 p-3 rounded-md alert-warning">
              <strong className="text-[14px]">Ventana de ajuste abierta</strong>
              <p className="m-0 text-[13px] leading-[1.45]">
                Podés cambiar tu campeón, pero si acertás sumás 10 pts en vez de 25.
              </p>
            </div>
          ) : null}

          {championInteractive ? (
            <PickableList
              items={ALL_TEAMS}
              selectedTeamId={championSelected}
              onSelect={(teamId) => setChampionSelected(teamId)}
            />
          ) : championPersistedId ? (
            <div className="flex items-center gap-3">
              <TeamIdentity team={resolveTeamData(championPersistedId)} size="lg" showFlag showName emphasis="hero" />
            </div>
          ) : null}

          {championInteractive ? (
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveChampion()} disabled={championSaveDisabled}>
                {isSaving
                  ? "Guardando..."
                  : championCanAdjust
                    ? "Confirmar ajuste"
                    : championPersistedId
                      ? "Guardar cambios"
                      : "Guardar"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Sub-Champion tab */}
      {activeTab === "sub-champion" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-small text-text-muted">MI SUB-CAMPEÓN</span>
            <StatusTag status={subStatusMeta.tone} label={subStatusMeta.label} />
          </div>
          {subChampionPick ? (
            <WindowChip
              pickWindow={subChampionPick.pickWindow}
              pointValue={subChampionPick.pickWindowPointValue}
              closesAt={subChampionPick.pickWindowClosesAt}
            />
          ) : null}

          {subInteractive && !hasChampion ? (
            <div className="grid gap-2 p-3 rounded-md alert-info">
              <p className="m-0 text-[13px] leading-[1.45]">
                Elegí tu campeón primero.
              </p>
              <div>
                <Button variant="secondary" onClick={() => switchTab("champion")}>
                  Ir a Campeón
                </Button>
              </div>
            </div>
          ) : null}

          {subCanAdjust ? (
            <div className="grid gap-1 p-3 rounded-md alert-warning">
              <strong className="text-[14px]">Ventana de ajuste abierta</strong>
              <p className="m-0 text-[13px] leading-[1.45]">
                El sub-campeón debe estar en la mitad opuesta a tu campeón. Las selecciones de la misma mitad aparecen deshabilitadas.
              </p>
            </div>
          ) : null}

          {subInteractive && hasChampion ? (
            <PickableList
              items={ALL_TEAMS}
              selectedTeamId={subChampionSelected}
              onSelect={(teamId) => setSubChampionSelected(teamId)}
              disabledItems={subDisabledItems}
              disabledHint={subCanAdjust ? "misma mitad" : "es tu campeón"}
            />
          ) : !subInteractive && subPersistedId ? (
            <div className="flex items-center gap-3">
              <TeamIdentity team={resolveTeamData(subPersistedId)} size="lg" showFlag showName emphasis="hero" />
            </div>
          ) : null}

          {subInteractive && hasChampion ? (
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveSubChampion()} disabled={subSaveDisabled}>
                {isSaving
                  ? "Guardando..."
                  : subCanAdjust
                    ? "Confirmar ajuste"
                    : subPersistedId
                      ? "Guardar cambios"
                      : "Guardar"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Best-Player tab (placeholder) */}
      {activeTab === "best-player" && !isLoading ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="typo-small text-text-muted">MI BALÓN DE ORO</span>
            <StatusTag status="neutral" label="Mayo 2026" />
          </div>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            Elegí al mejor jugador del Mundial cuando FIFA publique el roster oficial.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
