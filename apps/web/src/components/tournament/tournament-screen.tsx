"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_ROUTES,
  type ChampionPickResponse,
  type MatchStage,
  type MatchSummary,
  type PreTournamentSummary,
  type TournamentProjectionResponse,
  type TuMundialGroupCard,
  type TuMundialResponse
} from "@prode/shared";
import { Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import {
  pickQuickMatch,
  toCardTone,
  toLocalKickoffLabel,
  toStageLabel,
  toStatusLabel
} from "@/components/matches/matches-helpers";
import { ApiClientError, getChampionPick, getMatches, getPreTournamentSummary, getTournamentProjection, getTuMundial } from "@/lib/api/client";
import { canEditPrediction } from "@/lib/matches/editability";
import { BracketRound32 } from "./bracket-round-32";
import { ChampionPickerCard } from "./champion-picker-card";
import { ModeToggle, type TournamentMode } from "./mode-toggle";
import { PhaseKnockoutView } from "./phase-knockout-view";
import { PhaseTabs, type PhaseStatus, type PhaseTabItem, type TournamentPhase } from "./phase-tabs";
import { PredictionsGroupsView } from "./predictions-groups-view";
import { ResultsGroupsView } from "./results-groups-view";

const PHASE_DEFINITIONS: Array<{ phase: TournamentPhase; label: string; stages: MatchStage[] }> = [
  { phase: "groups", label: "Grupos", stages: ["group"] },
  { phase: "r32", label: "16vos", stages: ["R32"] },
  { phase: "r16", label: "8vos", stages: ["R16"] },
  { phase: "qf", label: "QF", stages: ["QF"] },
  { phase: "sf", label: "SF", stages: ["SF"] },
  { phase: "final", label: "Final", stages: ["BRONZE", "FINAL"] }
];

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
  errorMessage: string | null;
  groups: TuMundialGroupCard[];
  isLoading: boolean;
  matchesByPhase: Map<TournamentPhase, MatchSummary[]>;
  matchesByGroupId: Map<string, MatchSummary[]>;
  onModeSelect: (mode: TournamentMode) => void;
  onOpenChampionPicker: () => void;
  onOpenMatch: (matchId: string) => void;
  onPhaseSelect: (phase: TournamentPhase) => void;
  onPredictNext: () => void;
  onRetry: () => void;
  phaseItems: PhaseTabItem[];
  preTournamentSummary: PreTournamentSummary | null;
  projection: TournamentProjectionResponse | null;
  quickMatch: MatchSummary | null;
};

export function TournamentScreenView({
  activeMode,
  activePhase,
  championPick,
  errorMessage,
  groups,
  isLoading,
  matchesByPhase,
  matchesByGroupId,
  onModeSelect,
  onOpenChampionPicker,
  onOpenMatch,
  onPhaseSelect,
  onPredictNext,
  onRetry,
  phaseItems,
  projection,
  quickMatch
}: TournamentScreenViewProps) {
  const { locale } = useLocale();
  const activePhaseDefinition = PHASE_DEFINITIONS.find((p) => p.phase === activePhase) ?? PHASE_DEFINITIONS[0];
  const activePhaseMatches = matchesByPhase.get(activePhase) ?? [];

  return (
    <div className="grid gap-4">
      {quickMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: quickMatch.awayTeam.name,
            fifaCode: quickMatch.awayTeam.fifaCode,
            flagAsset: quickMatch.awayTeam.flagAsset,
            flagUrl: quickMatch.awayTeam.flagUrl
          }}
          ctaLabel={quickMatch.userPredictionSummary ? "Editar prediccion" : "Predecir"}
          eyebrow="TU PROXIMO"
          homeTeam={{
            teamName: quickMatch.homeTeam.name,
            fifaCode: quickMatch.homeTeam.fifaCode,
            flagAsset: quickMatch.homeTeam.flagAsset,
            flagUrl: quickMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(quickMatch.stage, quickMatch.groupId, locale)} · ${toLocalKickoffLabel(quickMatch.kickoffAt, locale)}`}
          onAction={onPredictNext}
          onSecondaryAction={onOpenChampionPicker}
          secondaryCtaLabel="Elegir campeon"
          status={toCardTone(quickMatch)}
          statusLabel={toStatusLabel(quickMatch)}
          title={`${quickMatch.homeTeam.name} vs ${quickMatch.awayTeam.name}`}
        />
      ) : (
        <Card elevated className="hero-worldcup-bg" style={{ gap: 8, padding: 20 }}>
          <span className="typo-small text-text-muted">TU MUNDIAL</span>
          <h1 className="typo-h2 m-0 text-text-primary">Todo al dia</h1>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            No tenes predicciones pendientes ahora. Aprovecha para revisar tus tablas o elegir a tu campeon.
          </p>
        </Card>
      )}

      <ChampionPickerCard data={championPick} onOpen={onOpenChampionPicker} />

      <ModeToggle activeMode={activeMode} onSelect={onModeSelect} />

      <PhaseTabs items={phaseItems} activePhase={activePhase} onSelect={onPhaseSelect} />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title="No pudimos cargar Tu Mundial" message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activeMode === "predictions" ? (
          activePhase === "groups" ? (
            <PredictionsGroupsView
              groups={groups}
              matchesByGroupId={matchesByGroupId}
              onOpenMatch={onOpenMatch}
            />
          ) : activePhase === "r32" && projection ? (
            <BracketRound32
              matches={projection.bracket.round32}
              readiness={projection.readiness}
              onOpenMatch={onOpenMatch}
            />
          ) : (
            <PhaseKnockoutView
              matches={activePhaseMatches}
              phaseLabel={activePhaseDefinition.label}
              onOpenMatch={onOpenMatch}
            />
          )
        ) : activePhase === "groups" ? (
          <ResultsGroupsView groups={groups} />
        ) : (
          <PhaseKnockoutView
            matches={activePhaseMatches}
            phaseLabel={activePhaseDefinition.label}
            onOpenMatch={onOpenMatch}
          />
        )
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
        setPreTournamentSummary(null);
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const [nextData, nextProjection, nextChampion, nextSummary, matchesResponse] = await Promise.all([
          getTuMundial(token),
          getTournamentProjection(token),
          getChampionPick(token),
          getPreTournamentSummary(token),
          getMatches(token, { limit: 200 })
        ]);

        if (!cancelled) {
          setData(nextData);
          setProjection(nextProjection);
          setChampionPick(nextChampion);
          setPreTournamentSummary(nextSummary);
          setItems(matchesResponse.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : "No pudimos cargar Tu Mundial.");
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

  const matchesByPhase = useMemo(() => {
    const map = new Map<TournamentPhase, MatchSummary[]>();

    for (const def of PHASE_DEFINITIONS) {
      map.set(def.phase, sortedItems.filter((m) => def.stages.includes(m.stage)));
    }

    return map;
  }, [sortedItems]);

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
      PHASE_DEFINITIONS.map((def) => {
        const phaseMatches = matchesByPhase.get(def.phase) ?? [];

        return {
          phase: def.phase,
          label: def.label,
          completed: countCompletedInPhase(phaseMatches),
          total: phaseMatches.length,
          status: resolvePhaseStatus(phaseMatches)
        };
      }),
    [matchesByPhase]
  );

  const quickMatch = useMemo(() => pickQuickMatch(sortedItems), [sortedItems]);
  const editableMatches = useMemo(
    () => sortedItems.filter((match) => canEditPrediction(match)),
    [sortedItems]
  );

  return (
    <>
      <TournamentScreenView
        activeMode={activeMode}
        activePhase={activePhase}
        championPick={championPick}
        errorMessage={errorMessage}
        groups={data?.groups ?? []}
        isLoading={isLoading}
        matchesByPhase={matchesByPhase}
        matchesByGroupId={matchesByGroupId}
        onModeSelect={setActiveMode}
        onOpenChampionPicker={() => router.push(APP_ROUTES.macroPicks)}
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onPhaseSelect={setActivePhase}
        onPredictNext={() => {
          if (quickMatch) {
            setActiveMatchId(quickMatch.matchId);
          }
        }}
        onRetry={() => setReloadKey((current) => current + 1)}
        phaseItems={phaseItems}
        preTournamentSummary={preTournamentSummary}
        projection={projection}
        quickMatch={quickMatch}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={editableMatches.filter((m) => m.matchId !== activeMatchId).length > 0}
        onClose={() => setActiveMatchId(null)}
        onSaved={() => {
          const remaining = editableMatches.filter((m) => m.matchId !== activeMatchId);
          const nextMatch = remaining.find((m) => m.predictionStatus === "empty") ?? remaining[0] ?? null;

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
