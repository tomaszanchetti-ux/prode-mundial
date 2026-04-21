"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_ROUTES,
  type BestPlayerPickResponse,
  type ChampionPickResponse,
  type MatchStage,
  type MatchSummary,
  type PreTournamentSummary,
  type SubChampionPickResponse,
  type TournamentProjectionResponse,
  type TuMundialGroupCard,
  type TuMundialResponse
} from "@prode/shared";
import { Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { ApiClientError, getBestPlayerPick, getChampionPick, getMatches, getPreTournamentSummary, getSubChampionPick, getTournamentProjection, getTuMundial } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { pickContextualHeroMatch, type ContextualHero } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { MisPicksSection } from "./mis-picks-section";
import { ModeToggle, type TournamentMode } from "./mode-toggle";
import { PhaseKnockoutView } from "./phase-knockout-view";
import { PhaseTabs, type PhaseStatus, type PhaseTabItem, type TournamentPhase } from "./phase-tabs";
import { PredictionsGroupsView } from "./predictions-groups-view";
import { ResultsGroupsView } from "./results-groups-view";
import { TournamentBracket } from "./tournament-bracket";

type PhaseDefinition = { phase: TournamentPhase; label: string; stages: MatchStage[] };

const PREDICTION_PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phase: "groups", label: "Grupos", stages: ["group"] },
  { phase: "r32", label: "16vos", stages: ["R32"] },
  { phase: "r16", label: "8vos", stages: ["R16"] },
  { phase: "qf", label: "QF", stages: ["QF"] },
  { phase: "sf", label: "SF", stages: ["SF"] },
  { phase: "final", label: "Final", stages: ["BRONZE", "FINAL"] }
];

const RESULT_PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phase: "groups", label: "Grupos", stages: ["group"] },
  { phase: "bracket", label: "Knock-outs", stages: ["R32", "R16", "QF", "SF", "BRONZE", "FINAL"] }
];

function resolvePhaseDefinitions(mode: TournamentMode): PhaseDefinition[] {
  return mode === "predictions" ? PREDICTION_PHASE_DEFINITIONS : RESULT_PHASE_DEFINITIONS;
}

const PHASE_UNLOCK_REASON: Record<Exclude<TournamentPhase, "groups" | "bracket">, string> = {
  r32: "Se habilita al cerrar la fase de grupos",
  r16: "Se habilita al cerrar los 16vos de final",
  qf: "Se habilita al cerrar los 8vos de final",
  sf: "Se habilita al cerrar los cuartos de final",
  final: "Se habilita al cerrar las semifinales"
};

function isPhaseUnlocked(
  phase: TournamentPhase,
  phaseUnlocks: TournamentProjectionResponse["phaseUnlocks"] | null
): boolean {
  if (!phaseUnlocks) {
    // No projection loaded yet → treat everything as unlocked to avoid a
    // flash of locked tabs on first render.
    return true;
  }

  switch (phase) {
    case "groups":
      return true;
    case "bracket":
      return true;
    case "r32":
      return phaseUnlocks.r32;
    case "r16":
      return phaseUnlocks.r16;
    case "qf":
      return phaseUnlocks.qf;
    case "sf":
      return phaseUnlocks.sf;
    case "final":
      return phaseUnlocks.bronzeFinal;
    default:
      return true;
  }
}

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();

  if (kickoffDifference !== 0) {
    return kickoffDifference;
  }

  return left.matchId.localeCompare(right.matchId);
}

function resolvePhaseStatus(phaseMatches: MatchSummary[]): PhaseStatus {
  if (phaseMatches.length === 0) {
    return "locked";
  }

  const allScored = phaseMatches.every((m) => m.isScored || m.predictionStatus === "scored");

  if (allScored) {
    return "scored";
  }

  const savedOrScored = phaseMatches.filter(
    (m) =>
      m.predictionStatus === "saved_editable" ||
      m.predictionStatus === "scored" ||
      m.predictionStatus === "locked_unscored"
  ).length;

  if (savedOrScored === phaseMatches.length) {
    return "complete";
  }

  if (savedOrScored > 0) {
    return "partial";
  }

  return "empty";
}

function countCompletedInPhase(phaseMatches: MatchSummary[]) {
  return phaseMatches.filter(
    (m) =>
      m.predictionStatus === "saved_editable" ||
      m.predictionStatus === "scored" ||
      m.predictionStatus === "locked_unscored"
  ).length;
}

type TournamentScreenViewProps = {
  activeMode: TournamentMode;
  activePhase: TournamentPhase;
  championPick: ChampionPickResponse | null;
  subChampionPick: SubChampionPickResponse | null;
  bestPlayerPick: BestPlayerPickResponse | null;
  errorMessage: string | null;
  groups: TuMundialGroupCard[];
  hero: ContextualHero | null;
  isLoading: boolean;
  matchesByPhase: Map<TournamentPhase, MatchSummary[]>;
  matchesByGroupId: Map<string, MatchSummary[]>;
  onHeroAction: () => void;
  onModeSelect: (mode: TournamentMode) => void;
  onOpenPicks: (tab?: "champion" | "sub-champion" | "best-player") => void;
  onOpenMatch: (matchId: string) => void;
  onPhaseSelect: (phase: TournamentPhase) => void;
  onRetry: () => void;
  phaseItems: PhaseTabItem[];
  preTournamentSummary: PreTournamentSummary | null;
  projection: TournamentProjectionResponse | null;
};

export function TournamentScreenView({
  activeMode,
  activePhase,
  championPick,
  subChampionPick,
  bestPlayerPick,
  errorMessage,
  groups,
  hero,
  isLoading,
  matchesByPhase,
  matchesByGroupId,
  onHeroAction,
  onModeSelect,
  onOpenPicks,
  onOpenMatch,
  onPhaseSelect,
  onRetry,
  phaseItems,
  projection
}: TournamentScreenViewProps) {
  const { locale } = useLocale();

  const heroProps = hero
    ? toHeroProps({
        match: hero.match,
        state: hero.state,
        locale,
        onAction: onHeroAction
      })
    : null;

  return (
    <div className="grid gap-4">
      {heroProps ? (
        <NextMatchHero {...heroProps} />
      ) : (
        <Card elevated className="hero-worldcup-bg" style={{ gap: 8, padding: 20 }}>
          <span className="typo-small text-text-muted">MI MUNDIAL</span>
          <h1 className="typo-h2 m-0 text-text-primary">Todo al dia</h1>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            No tenes predicciones pendientes ahora. Aprovecha para revisar tus tablas o elegir a tu campeon.
          </p>
        </Card>
      )}

      <MisPicksSection
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        onOpenPicks={onOpenPicks}
      />

      <ModeToggle activeMode={activeMode} onSelect={onModeSelect} />

      <PhaseTabs items={phaseItems} activePhase={activePhase} onSelect={onPhaseSelect} />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title="No pudimos cargar Predicciones" message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activeMode === "predictions" ? (
          activePhase === "groups" ? (
            <PredictionsGroupsView
              groups={groups}
              matchesByGroupId={matchesByGroupId}
              onOpenMatch={onOpenMatch}
            />
          ) : (
            <PhaseKnockoutView
              matches={matchesByPhase.get(activePhase) ?? []}
              phaseLabel={
                resolvePhaseDefinitions("predictions").find((def) => def.phase === activePhase)?.label ?? ""
              }
              onOpenMatch={onOpenMatch}
            />
          )
        ) : activePhase === "groups" ? (
          <ResultsGroupsView groups={groups} />
        ) : projection ? (
          <TournamentBracket
            bracket={projection.bracket}
            readiness={projection.readiness}
            onOpenMatch={onOpenMatch}
          />
        ) : null
      ) : null}
    </div>
  );
}

export function TournamentScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [data, setData] = useState<TuMundialResponse | null>(null);
  const [projection, setProjection] = useState<TournamentProjectionResponse | null>(null);
  const [championPick, setChampionPick] = useState<ChampionPickResponse | null>(null);
  const [subChampionPick, setSubChampionPick] = useState<SubChampionPickResponse | null>(null);
  const [bestPlayerPick, setBestPlayerPick] = useState<BestPlayerPickResponse | null>(null);
  const [preTournamentSummary, setPreTournamentSummary] = useState<PreTournamentSummary | null>(null);
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<TournamentPhase>("groups");
  const [activeMode, setActiveMode] = useState<TournamentMode>("predictions");

  useEffect(() => {
    let cancelled = false;

    async function loadTournament() {
      if (status !== "authenticated" || !user) {
        setData(null);
        setProjection(null);
        setChampionPick(null);
        setSubChampionPick(null);
        setBestPlayerPick(null);
        setPreTournamentSummary(null);
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [nextData, nextProjection, nextChampion, nextSubChampion, nextBestPlayer, nextSummary, matchesResponse] = await Promise.all([
          getTuMundial(token),
          getTournamentProjection(token),
          getChampionPick(token),
          getSubChampionPick(token),
          getBestPlayerPick(token),
          getPreTournamentSummary(token),
          getMatches(token, { limit: 200 })
        ]);

        if (!cancelled) {
          setData(nextData);
          setProjection(nextProjection);
          setChampionPick(nextChampion);
          setSubChampionPick(nextSubChampion);
          setBestPlayerPick(nextBestPlayer);
          setPreTournamentSummary(nextSummary);
          setItems(matchesResponse.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos cargar Predicciones.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTournament();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const sortedItems = useMemo(() => [...items].sort(compareMatchesChronologically), [items]);

  const phaseDefinitions = useMemo(() => resolvePhaseDefinitions(activeMode), [activeMode]);

  const matchesByPhase = useMemo(() => {
    const map = new Map<TournamentPhase, MatchSummary[]>();

    for (const def of phaseDefinitions) {
      map.set(def.phase, sortedItems.filter((m) => def.stages.includes(m.stage)));
    }

    return map;
  }, [sortedItems, phaseDefinitions]);

  const matchesByGroupId = useMemo(() => {
    const map = new Map<string, MatchSummary[]>();
    const groupMatches = matchesByPhase.get("groups") ?? [];

    for (const match of groupMatches) {
      if (!match.groupId) {
        continue;
      }

      const bucket = map.get(match.groupId) ?? [];
      bucket.push(match);
      map.set(match.groupId, bucket);
    }

    return map;
  }, [matchesByPhase]);

  const phaseItems = useMemo<PhaseTabItem[]>(
    () =>
      phaseDefinitions.map((def) => {
        const phaseMatches = matchesByPhase.get(def.phase) ?? [];
        const unlocked =
          activeMode === "predictions"
            ? isPhaseUnlocked(def.phase, projection?.phaseUnlocks ?? null)
            : true;
        const baseStatus = resolvePhaseStatus(phaseMatches);
        const gated = !unlocked;
        const disabledReason =
          gated && def.phase !== "groups" && def.phase !== "bracket"
            ? PHASE_UNLOCK_REASON[def.phase]
            : undefined;

        return {
          phase: def.phase,
          label: def.label,
          completed: countCompletedInPhase(phaseMatches),
          total: phaseMatches.length,
          status: gated ? "locked" : baseStatus,
          isDisabled: gated,
          disabledReason
        };
      }),
    [matchesByPhase, phaseDefinitions, activeMode, projection]
  );

  const handleModeSelect = (nextMode: TournamentMode) => {
    setActiveMode(nextMode);
    const validPhases = resolvePhaseDefinitions(nextMode).map((def) => def.phase);

    if (!validPhases.includes(activePhase)) {
      setActivePhase("groups");
    }
  };

  const hero = useMemo(
    () => pickContextualHeroMatch(sortedItems, "predictions-first"),
    [sortedItems]
  );
  const editableMatches = useMemo(
    () => sortedItems.filter((match) => canEditPrediction(match)),
    [sortedItems]
  );

  const handleHeroAction = () => {
    if (!hero) return;
    setActiveMatchId(hero.match.matchId);
  };

  return (
    <>
      <TournamentScreenView
        activeMode={activeMode}
        activePhase={activePhase}
        championPick={championPick}
        subChampionPick={subChampionPick}
        bestPlayerPick={bestPlayerPick}
        errorMessage={errorMessage}
        groups={data?.groups ?? []}
        hero={hero}
        isLoading={isLoading}
        matchesByPhase={matchesByPhase}
        matchesByGroupId={matchesByGroupId}
        onHeroAction={handleHeroAction}
        onModeSelect={handleModeSelect}
        onOpenPicks={(tab) =>
          router.push(tab ? `${APP_ROUTES.picks}?tab=${tab}` : APP_ROUTES.picks)
        }
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onPhaseSelect={setActivePhase}
        onRetry={() => setReloadKey((current) => current + 1)}
        phaseItems={phaseItems}
        preTournamentSummary={preTournamentSummary}
        projection={projection}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={
          editableMatches.filter((m) => m.predictionStatus === "empty" && m.matchId !== activeMatchId).length > 0
        }
        onClose={() => setActiveMatchId(null)}
        onSaved={() => {
          const pendingMatches = editableMatches.filter(
            (m) => m.predictionStatus === "empty" && m.matchId !== activeMatchId
          );
          const nextMatch = pendingMatches[0] ?? null;

          if (nextMatch) {
            setActiveMatchId(nextMatch.matchId);
          } else {
            setActiveMatchId(null);
          }
          setReloadKey((current) => current + 1);
        }}
      />
    </>
  );
}
