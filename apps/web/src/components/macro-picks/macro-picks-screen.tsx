"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ChampionPickResponse } from "@prode/shared";
import { APP_ROUTES, resolveTeamIdentity } from "@prode/shared";
import { Button, Card, ErrorCard, SkeletonCard, StatusTag, TeamIdentity } from "@prode/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError, getChampionPick, saveChampionPick, adjustChampionPick } from "@/lib/api/client";

// ── 48 World Cup 2026 teams ─────────────────────────────

type TeamEntry = { teamId: string; name: string };

const WORLD_CUP_TEAMS: TeamEntry[] = [
  { teamId: "ALG", name: "Algeria" },
  { teamId: "ARG", name: "Argentina" },
  { teamId: "AUS", name: "Australia" },
  { teamId: "AUT", name: "Austria" },
  { teamId: "BEL", name: "Belgium" },
  { teamId: "BIH", name: "Bosnia and Herzegovina" },
  { teamId: "BRA", name: "Brazil" },
  { teamId: "CAN", name: "Canada" },
  { teamId: "CIV", name: "Ivory Coast" },
  { teamId: "COD", name: "DR Congo" },
  { teamId: "COL", name: "Colombia" },
  { teamId: "CPV", name: "Cape Verde" },
  { teamId: "CRO", name: "Croatia" },
  { teamId: "CUW", name: "Curacao" },
  { teamId: "CZE", name: "Czech Republic" },
  { teamId: "ECU", name: "Ecuador" },
  { teamId: "EGY", name: "Egypt" },
  { teamId: "ENG", name: "England" },
  { teamId: "ESP", name: "Spain" },
  { teamId: "FRA", name: "France" },
  { teamId: "GER", name: "Germany" },
  { teamId: "GHA", name: "Ghana" },
  { teamId: "HAI", name: "Haiti" },
  { teamId: "IRN", name: "Iran" },
  { teamId: "IRQ", name: "Iraq" },
  { teamId: "JOR", name: "Jordan" },
  { teamId: "JPN", name: "Japan" },
  { teamId: "KOR", name: "South Korea" },
  { teamId: "KSA", name: "Saudi Arabia" },
  { teamId: "MAR", name: "Morocco" },
  { teamId: "MEX", name: "Mexico" },
  { teamId: "NED", name: "Netherlands" },
  { teamId: "NOR", name: "Norway" },
  { teamId: "NZL", name: "New Zealand" },
  { teamId: "PAN", name: "Panama" },
  { teamId: "PAR", name: "Paraguay" },
  { teamId: "POR", name: "Portugal" },
  { teamId: "QAT", name: "Qatar" },
  { teamId: "RSA", name: "South Africa" },
  { teamId: "SCO", name: "Scotland" },
  { teamId: "SEN", name: "Senegal" },
  { teamId: "SUI", name: "Switzerland" },
  { teamId: "SWE", name: "Sweden" },
  { teamId: "TUN", name: "Tunisia" },
  { teamId: "TUR", name: "Turkey" },
  { teamId: "URU", name: "Uruguay" },
  { teamId: "USA", name: "United States" },
  { teamId: "UZB", name: "Uzbekistan" }
];

// ── Helpers ─────────────────────────────────────────────

function resolveTeamData(teamId: string) {
  const identity = resolveTeamIdentity(teamId);
  const entry = WORLD_CUP_TEAMS.find((t) => t.teamId === teamId);

  return {
    fifaCode: identity.fifaCode,
    flagAsset: identity.flagAsset,
    flagUrl: identity.flagUrl,
    name: entry?.name ?? teamId
  };
}

type StatusMeta = { label: string; tone: "editable" | "saved" | "closing-soon" | "live" | "scored" | "neutral"; description: string };

function resolveStatusMeta(status: ChampionPickResponse["status"]): StatusMeta {
  switch (status) {
    case "empty":
      return { label: "Sin elegir", tone: "editable", description: "Elegi tu campeon antes de que arranque el torneo." };
    case "picked":
      return { label: "Elegido", tone: "editable", description: "Tu campeon esta guardado. Podes cambiarlo hasta el inicio del torneo." };
    case "locked":
      return { label: "Bloqueado", tone: "neutral", description: "El torneo empezo. Tu pick original esta congelado." };
    case "adjustment_available":
      return { label: "Ajuste disponible", tone: "live", description: "La fase de grupos termino. Podes cambiar tu campeon, pero suma 10 pts en vez de 25." };
    case "adjusted":
      return { label: "Ajustado", tone: "neutral", description: "Tu campeon ajustado quedo guardado. Si acertas, sumas 10 pts." };
    case "scored":
      return { label: "Puntuado", tone: "scored", description: "Los puntos de tu campeon ya fueron calculados." };
  }
}

function formatDeadline(iso: string | null): string {
  if (!iso) return "Por definir";

  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

// ── Screen ──────────────────────────────────────────────

export function MacroPicksScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [data, setData] = useState<ChampionPickResponse | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return WORLD_CUP_TEAMS;
    const query = searchQuery.toLowerCase().trim();
    return WORLD_CUP_TEAMS.filter(
      (team) => team.name.toLowerCase().includes(query) || team.teamId.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Derive UI state
  const statusMeta = resolveStatusMeta(data?.status ?? "empty");
  const canEdit = data?.status === "empty" || data?.status === "picked";
  const canAdjust = data?.status === "adjustment_available";
  const isFullyLocked = data?.status === "locked" || data?.status === "adjusted" || data?.status === "scored";
  const currentPick = data?.adjustedChampionTeamId ?? data?.championTeamId ?? null;

  // Load data
  useEffect(() => {
    let cancelled = false;

    async function loadPick() {
      if (status !== "authenticated" || !user) {
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const nextData = await getChampionPick(token);

        if (!cancelled) {
          setData(nextData);
          setSelectedTeamId(nextData.championTeamId);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No pudimos cargar tu campeon."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPick();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  // Save handler (pre-tournament)
  async function handleSave() {
    if (!user || !selectedTeamId) return;

    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      await saveChampionPick(token, { championTeamId: selectedTeamId });
      setFeedbackMessage("Tu campeon quedo guardado. Podes cambiarlo hasta el inicio del torneo.");
      setReloadKey((k) => k + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No pudimos guardar tu campeon."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Adjustment handler (post-groups)
  async function handleAdjust() {
    if (!user || !selectedTeamId) return;

    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await adjustChampionPick(token, { championTeamId: selectedTeamId });
      setFeedbackMessage(response.penaltyNotice);
      setReloadKey((k) => k + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No pudimos confirmar tu ajuste."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isInteractive = canEdit || canAdjust;

  return (
    <div className="grid gap-4">
      {/* Hero card */}
      <Card elevated className="hero-worldcup-bg" style={{ gap: 12, padding: 20 }}>
        <div className="flex justify-between gap-3 items-start flex-wrap">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-3">
              <img src="/mundial/wc2026-logo.png" alt="" width={32} height={32} className="opacity-70" />
              <span className="typo-small text-text-muted">MI CAMPEON</span>
            </div>
            <h1 className="typo-h2 m-0 text-text-primary">Mi Campeon</h1>
            <p className="typo-body m-0 text-text-secondary">
              Elegi la seleccion que levanta la copa.
            </p>
          </div>
          <StatusTag status={statusMeta.tone} label={statusMeta.label} />
        </div>

        <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">{statusMeta.description}</p>

        <div className="flex gap-2.5 flex-wrap">
          <Button variant="ghost" onClick={() => router.push(APP_ROUTES.tournament)}>
            Volver a Mi Mundial
          </Button>
          {canEdit && selectedTeamId ? (
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Guardando..." : data?.championTeamId ? "Cambiar campeon" : "Elegir campeon"}
            </Button>
          ) : null}
          {canAdjust && selectedTeamId && selectedTeamId !== data?.championTeamId ? (
            <Button onClick={() => void handleAdjust()} disabled={isSaving}>
              {isSaving ? "Confirmando..." : "Confirmar ajuste"}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Scoring rules */}
      <Card elevated style={{ gap: 8, padding: 16 }}>
        <span className="typo-small text-text-muted">PUNTUACION</span>
        <p className="m-0 text-[14px] leading-[1.55] text-text-secondary">
          25 pts si acertas desde el inicio. 10 pts si cambias tras la fase de grupos.
        </p>
      </Card>

      {/* Schedule info */}
      {data ? (
        <Card elevated style={{ gap: 10, padding: 16 }}>
          <span className="typo-small text-text-muted">VENTANAS</span>
          <span className="text-[15px] leading-[1.45] text-text-primary">
            Cierre inicial: {formatDeadline(data.initialDeadlineAt)}
          </span>
          <span className="text-[14px] leading-[1.45] text-text-secondary">
            Ajuste: {formatDeadline(data.adjustmentWindowOpensAt)} → {formatDeadline(data.adjustmentWindowClosesAt)}
          </span>
        </Card>
      ) : null}

      {/* Current pick display */}
      {currentPick && !canEdit ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <span className="typo-small text-text-muted">
            {data?.adjustedChampionTeamId ? "CAMPEON AJUSTADO" : "MI CAMPEON"}
          </span>
          <div className="flex items-center gap-3">
            <TeamIdentity team={resolveTeamData(currentPick)} size="lg" showFlag showName emphasis="hero" />
          </div>
          {data?.scoringResult ? (
            <div className="flex items-center gap-2 mt-1">
              <StatusTag
                status={data.scoringResult.points > 0 ? "scored" : "neutral"}
                label={`${data.scoringResult.points} pts`}
              />
              {data.scoringResult.wasAdjusted ? (
                <span className="text-[13px] text-text-muted">(campeon ajustado)</span>
              ) : null}
            </div>
          ) : null}
          {data?.championTeamId && data.adjustedChampionTeamId && data.championTeamId !== data.adjustedChampionTeamId ? (
            <div className="flex items-center gap-2 mt-1 opacity-60">
              <span className="text-[13px] text-text-muted">Original:</span>
              <TeamIdentity team={resolveTeamData(data.championTeamId)} size="sm" showFlag showName emphasis="compact" />
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Adjustment notice */}
      {canAdjust ? (
        <div className="grid gap-2 p-4 rounded-md alert-warning">
          <strong className="text-[16px]">Ventana de ajuste abierta</strong>
          <p className="m-0 text-[14px] leading-[1.45]">
            Podes cambiar tu campeon, pero si acertas sumas 10 pts en vez de 25.
          </p>
        </div>
      ) : null}

      {/* Feedback */}
      {feedbackMessage ? (
        <div className="grid gap-2 p-4 rounded-md alert-info">
          <strong className="text-[16px]">Listo</strong>
          <p className="m-0 text-[14px] leading-[1.45]">{feedbackMessage}</p>
        </div>
      ) : null}

      {/* Error */}
      {errorMessage ? (
        <ErrorCard title="No pudimos procesar tu campeon" message={errorMessage} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : null}

      {/* Loading */}
      {isLoading ? <SkeletonCard lines={3} /> : null}

      {/* Team selector (only when interactive) */}
      {!isLoading && isInteractive ? (
        <Card elevated style={{ gap: 12, padding: 16 }}>
          <span className="typo-small text-text-muted">SELECCIONA UNA SELECCION</span>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar seleccion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
            />
          </div>

          {/* Teams grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {filteredTeams.map((team) => {
              const isSelected = selectedTeamId === team.teamId;
              const teamData = resolveTeamData(team.teamId);

              return (
                <button
                  key={team.teamId}
                  type="button"
                  onClick={() => setSelectedTeamId(team.teamId)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition-colors cursor-pointer border ${
                    isSelected
                      ? "border-accent-primary bg-accent-primary/10 ring-2 ring-accent-primary/30"
                      : "border-border-default bg-surface-default hover:bg-surface-raised"
                  }`}
                >
                  <TeamIdentity team={teamData} size="md" showFlag showName={false} />
                  <span className={`text-[12px] leading-[1.2] font-medium ${isSelected ? "text-accent-primary" : "text-text-primary"}`}>
                    {team.teamId}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredTeams.length === 0 ? (
            <p className="text-[14px] text-text-muted text-center py-4">
              No se encontraron selecciones.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Locked state - show full team grid (read-only) */}
      {!isLoading && isFullyLocked && !canAdjust ? null : null}
    </div>
  );
}
