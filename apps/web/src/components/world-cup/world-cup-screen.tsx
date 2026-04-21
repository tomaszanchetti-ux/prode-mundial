"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  computeFullGroupStandings,
  type FullGroupStandings,
  type GroupMatchResult,
  type MatchSummary
} from "@prode/shared";
import { AdSlotCard, Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale, copyForLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { pickContextualHeroMatch, type ContextualHero } from "@/lib/hero/pick-contextual-hero";
import { toHeroProps } from "@/lib/hero/to-hero-props";
import { WORLD_CUP_2026_OFFICIAL_GROUPS } from "@/lib/world-cup/groups";
import { buildOfficialBracket } from "@/lib/world-cup/build-official-bracket";
import { TournamentBracket } from "@/components/tournament/tournament-bracket";
import { QuickPredictionModal } from "@/components/matches/quick-prediction-modal";
import { canEditPrediction } from "@/lib/matches/editability";
import { SimpleTabs, type SimpleTabItem } from "@/components/ui/simple-tabs";
import { WorldCupGroupCard } from "./world-cup-group-card";

// World Cup uses 2 tabs: official groups + official knockout bracket.
// Both are read-only projections of the SOT — no simulator, no predictions.
type WorldCupTab = "groups" | "bracket";

const TAB_LABELS: Record<WorldCupTab, string> = {
  groups: "Grupos",
  bracket: "Cruces"
};

function compareMatchesChronologically(left: MatchSummary, right: MatchSummary) {
  const kickoffDifference = new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime();
  if (kickoffDifference !== 0) return kickoffDifference;
  return left.matchId.localeCompare(right.matchId);
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
  hero: ContextualHero | null;
  isLoading: boolean;
  onHeroAction: () => void;
  onOpenMatch: (matchId: string) => void;
  onRetry: () => void;
  onTabSelect: (tab: WorldCupTab) => void;
  tabItems: SimpleTabItem<WorldCupTab>[];
};

export function WorldCupScreenView({
  activeTab,
  bracket,
  bracketReadiness,
  errorMessage,
  groups,
  hero,
  isLoading,
  onHeroAction,
  onOpenMatch,
  onRetry,
  onTabSelect,
  tabItems
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
        <Card elevated className="hero-worldcup-bg" style={{ gap: 6, padding: 16 }}>
          <span className="typo-small text-text-muted">RESULTADOS</span>
          <h1 className="typo-h2 m-0 text-text-primary">{copyForLocale(locale, "Mundial 2026", "World Cup 2026")}</h1>
        </Card>
      )}

      <SimpleTabs items={tabItems} activeTab={activeTab} onSelect={onTabSelect} ariaLabel="Resultados" />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title={copyForLocale(locale, "No pudimos cargar Resultados", "Could not load Results")} message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activeTab === "groups" ? (
          <section className="grid gap-3">
            {groups.map((group, idx) => (
              <React.Fragment key={group.groupId}>
                <WorldCupGroupCard group={group} groupName={groupDisplayName(group.groupId)} />
                {idx > 0 && (idx + 1) % 3 === 0 && idx < groups.length - 1 ? (
                  <AdSlotCard
                    description={copyForLocale(
                      locale,
                      "Espacio reservado para patrocinio nativo.",
                      "Reserved slot for native sponsorship."
                    )}
                  />
                ) : null}
              </React.Fragment>
            ))}
          </section>
        ) : (
          <TournamentBracket
            bracket={bracket}
            readiness={bracketReadiness}
            onOpenMatch={onOpenMatch}
            showReadinessBanner={false}
          />
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
                : "No pudimos cargar Resultados."
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

  const { bracket, readiness: bracketReadiness } = useMemo(
    () => buildOfficialBracket(sortedItems),
    [sortedItems]
  );

  const tabItems = useMemo<SimpleTabItem<WorldCupTab>[]>(
    () => [
      { key: "groups", label: TAB_LABELS.groups },
      { key: "bracket", label: TAB_LABELS.bracket }
    ],
    []
  );

  const hero = useMemo(
    () => pickContextualHeroMatch(sortedItems, "live-first"),
    [sortedItems]
  );

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
        hero={hero}
        isLoading={isLoading}
        onHeroAction={handleHeroAction}
        onOpenMatch={(matchId) => setActiveMatchId(matchId)}
        onRetry={() => setReloadKey((k) => k + 1)}
        onTabSelect={setActiveTab}
        tabItems={tabItems}
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
