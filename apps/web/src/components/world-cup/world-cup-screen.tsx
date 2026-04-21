"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  computeFullGroupStandings,
  type FullGroupStandings,
  type GroupMatchResult,
  type MatchSummary
} from "@prode/shared";
import { Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale, copyForLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { pickContextualHeroMatch, type ContextualHero } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { WORLD_CUP_2026_OFFICIAL_GROUPS } from "@/lib/world-cup/groups";
import { buildOfficialBracket } from "@/lib/world-cup/build-official-bracket";
import { PhaseTabs, type PhaseStatus, type PhaseTabItem, type TournamentPhase } from "@/components/tournament/phase-tabs";
import { TournamentBracket } from "@/components/tournament/tournament-bracket";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { canEditPrediction } from "@/lib/matches/editability";
import { WorldCupGroupCard } from "./world-cup-group-card";

// World Cup uses 2 tabs (mirror of `/tournament` Mis Resultados): official
// groups + official knockout bracket. Both are read-only projections of the
// SOT — no simulator, no predictions.
type WorldCupTab = Extract<TournamentPhase, "groups" | "bracket">;

const TAB_LABELS: Record<WorldCupTab, string> = {
  groups: "Grupos",
  bracket: "Knock-outs"
};

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();
  if (kickoffDifference !== 0) return kickoffDifference;
  return left.matchId.localeCompare(right.matchId);
}

function resolveOfficialPhaseStatus(matches: MatchSummary[]): PhaseStatus {
  if (matches.length === 0) return "locked";

  const finished = matches.filter((m) => m.status === "finished").length;

  if (finished === matches.length) return "scored";
  if (finished > 0) return "partial";
  if (matches.some((m) => m.status === "live")) return "partial";
  return "empty";
}

function toGroupMatchResults(groupMatches: MatchSummary[]): GroupMatchResult[] {
  return groupMatches
    .filter(
      (m): m is MatchSummary & { groupId: string; homeScore90: number; awayScore90: number } =>
        m.groupId !== null &&
        m.homeScore90 !== null &&
        m.awayScore90 !== null &&
        m.homeTeam.teamId.length > 0 &&
        m.awayTeam.teamId.length > 0 &&
        !m.homeTeam.teamId.startsWith("slot:") &&
        !m.awayTeam.teamId.startsWith("slot:")
    )
    .map((m) => ({
      matchId: m.matchId,
      groupId: m.groupId,
      homeTeamId: m.homeTeam.teamId,
      awayTeamId: m.awayTeam.teamId,
      homeScore: m.homeScore90,
      awayScore: m.awayScore90
    }));
}

function groupDisplayName(groupId: string) {
  return `Grupo ${groupId}`;
}

type WorldCupScreenViewProps = {
  activeTab: WorldCupTab;
  bracket: ReturnType<typeof buildOfficialBracket>["bracket"];
  bracketReadiness: ReturnType<typeof buildOfficialBracket>["readiness"];
  errorMessage: string | null;
  groups: FullGroupStandings[];
  groupMatchCountsByGroupId: Map<string, { played: number; total: number }>;
  hero: ContextualHero | null;
  isLoading: boolean;
  knockoutsFinished: number;
  knockoutsTotal: number;
  onHeroAction: () => void;
  onOpenMatch: (matchId: string) => void;
  onRetry: () => void;
  onTabSelect: (tab: WorldCupTab) => void;
  phaseItems: PhaseTabItem[];
  totalMatchesFinished: number;
  totalMatches: number;
};

export function WorldCupScreenView({
  activeTab,
  bracket,
  bracketReadiness,
  errorMessage,
  groups,
  groupMatchCountsByGroupId,
  hero,
  isLoading,
  knockoutsFinished,
  knockoutsTotal,
  onHeroAction,
  onOpenMatch,
  onRetry,
  onTabSelect,
  phaseItems,
  totalMatchesFinished,
  totalMatches
}: WorldCupScreenViewProps) {
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
          <span className="typo-small text-text-muted">EL MUNDIAL</span>
          <h1 className="typo-h2 m-0 text-text-primary">{copyForLocale(locale, "Mundial 2026", "World Cup 2026")}</h1>
          <p className="m-0 text-[14px] leading-[1.45] text-text-secondary">
            {copyForLocale(
              locale,
              "Seguí el torneo real: grupos, cruces y camino al campeón.",
              "Follow the real tournament: groups, brackets and road to the champion."
            )}
          </p>
          <p className="m-0 text-[13px] leading-[1.4] text-text-muted">
            {copyForLocale(
              locale,
              `Llevás ${totalMatchesFinished} de ${totalMatches} partidos disputados.`,
              `${totalMatchesFinished} of ${totalMatches} matches played so far.`
            )}
          </p>
        </Card>
      )}

      <PhaseTabs items={phaseItems} activePhase={activeTab} onSelect={(phase) => onTabSelect(phase as WorldCupTab)} />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title={copyForLocale(locale, "No pudimos cargar la Tabla", "Could not load the Standings")} message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activeTab === "groups" ? (
          <section className="grid gap-3">
            {groups.map((group) => {
              const counts = groupMatchCountsByGroupId.get(group.groupId) ?? { played: 0, total: 0 };
              return (
                <WorldCupGroupCard
                  key={group.groupId}
                  group={group}
                  groupName={groupDisplayName(group.groupId)}
                  playedMatches={counts.played}
                  totalMatches={counts.total}
                />
              );
            })}
          </section>
        ) : (
          <section className="grid gap-3">
            <Card elevated style={{ gap: 4, padding: 12 }}>
              <span className="typo-small text-text-muted">CRUCES OFICIALES</span>
              <p className="m-0 text-[13px] leading-[1.4] text-text-secondary">
                {copyForLocale(
                  locale,
                  `${knockoutsFinished} de ${knockoutsTotal} partidos de knock-out disputados. Los cruces se completan a medida que cierra cada fase.`,
                  `${knockoutsFinished} of ${knockoutsTotal} knockout matches played. Matchups fill in as each round closes.`
                )}
              </p>
            </Card>
            <TournamentBracket
              bracket={bracket}
              readiness={bracketReadiness}
              onOpenMatch={onOpenMatch}
              showReadinessBanner={false}
            />
          </section>
        )
      ) : null}
    </div>
  );
}

export function WorldCupScreen() {
  const { status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<WorldCupTab>("groups");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorldCup() {
      if (status !== "authenticated" || !user) {
        setItems([]);
        setIsLoading(status === "loading");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await user.getIdToken();
        const matchesResponse = await getMatches(token, { limit: 200 });

        if (!cancelled) {
          setItems(matchesResponse.items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No pudimos cargar la Tabla."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWorldCup();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, status, user]);

  const sortedItems = useMemo(() => [...items].sort(compareMatchesChronologically), [items]);

  const groupMatches = useMemo(() => sortedItems.filter((m) => m.stage === "group"), [sortedItems]);
  const knockoutMatches = useMemo(() => sortedItems.filter((m) => m.stage !== "group"), [sortedItems]);

  const groups = useMemo(
    () => computeFullGroupStandings(WORLD_CUP_2026_OFFICIAL_GROUPS, toGroupMatchResults(groupMatches)),
    [groupMatches]
  );

  const groupMatchCountsByGroupId = useMemo(() => {
    const map = new Map<string, { played: number; total: number }>();
    for (const group of WORLD_CUP_2026_OFFICIAL_GROUPS) {
      const matchesForGroup = groupMatches.filter((m) => m.groupId === group.groupId);
      map.set(group.groupId, {
        played: matchesForGroup.filter((m) => m.status === "finished").length,
        total: matchesForGroup.length
      });
    }
    return map;
  }, [groupMatches]);

  const { bracket, readiness: bracketReadiness } = useMemo(
    () => buildOfficialBracket(sortedItems),
    [sortedItems]
  );

  const phaseItems = useMemo<PhaseTabItem[]>(
    () => [
      {
        phase: "groups",
        label: TAB_LABELS.groups,
        completed: groupMatches.filter((m) => m.status === "finished").length,
        total: groupMatches.length,
        status: resolveOfficialPhaseStatus(groupMatches)
      },
      {
        phase: "bracket",
        label: TAB_LABELS.bracket,
        completed: knockoutMatches.filter((m) => m.status === "finished").length,
        total: knockoutMatches.length,
        status: resolveOfficialPhaseStatus(knockoutMatches)
      }
    ],
    [groupMatches, knockoutMatches]
  );

  const hero = useMemo(
    () => pickContextualHeroMatch(sortedItems, "live-first"),
    [sortedItems]
  );

  const totalMatchesFinished = useMemo(
    () => sortedItems.filter((m) => m.status === "finished").length,
    [sortedItems]
  );

  const knockoutsFinished = knockoutMatches.filter((m) => m.status === "finished").length;

  const handleHeroAction = () => {
    if (!hero) return;
    setActiveMatchId(hero.match.matchId);
  };

  return (
    <>
      <WorldCupScreenView
        activeTab={activeTab}
        bracket={bracket}
        bracketReadiness={bracketReadiness}
        errorMessage={errorMessage}
        groups={groups}
        groupMatchCountsByGroupId={groupMatchCountsByGroupId}
        hero={hero}
        isLoading={isLoading}
        knockoutsFinished={knockoutsFinished}
        knockoutsTotal={knockoutMatches.length}
        onHeroAction={handleHeroAction}
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onRetry={() => setReloadKey((k) => k + 1)}
        onTabSelect={setActiveTab}
        phaseItems={phaseItems}
        totalMatchesFinished={totalMatchesFinished}
        totalMatches={sortedItems.length}
      />

      <QuickPredictionModal
        matchId={activeMatchId}
        isOpen={activeMatchId !== null}
        hasNextPending={
          sortedItems.filter(
            (m) => canEditPrediction(m) && m.predictionStatus === "empty" && m.matchId !== activeMatchId
          ).length > 0
        }
        onClose={() => setActiveMatchId(null)}
        onSaved={() => {
          setActiveMatchId(null);
          setReloadKey((k) => k + 1);
        }}
      />
    </>
  );
}
