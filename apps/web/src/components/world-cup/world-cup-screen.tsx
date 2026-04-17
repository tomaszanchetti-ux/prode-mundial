"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APP_ROUTES,
  computeFullGroupStandings,
  type FullGroupStandings,
  type GroupMatchResult,
  type MatchStage,
  type MatchSummary
} from "@prode/shared";
import { Card, ErrorCard, NextMatchHero, SkeletonCard } from "@prode/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale, copyForLocale } from "@/lib/i18n/locale-provider";
import { ApiClientError, getMatches } from "@/lib/api/client";
import { toLocalKickoffLabel, toStageLabel } from "@/components/matches/matches-helpers";
import { WORLD_CUP_2026_OFFICIAL_GROUPS } from "@/lib/world-cup/groups";
import { PhaseTabs, type PhaseStatus, type PhaseTabItem, type TournamentPhase } from "@/components/tournament/phase-tabs";
import { WorldCupGroupCard } from "./world-cup-group-card";
import { WorldCupMatchList } from "./world-cup-match-list";

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

function pickHeroMatch(matches: MatchSummary[], now = new Date()): MatchSummary | null {
  const live = matches.find((m) => m.status === "live");
  if (live) return live;

  const nowTs = now.getTime();
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && new Date(m.kickoffAt).getTime() > nowTs)
    .sort(compareMatchesChronologically);
  if (upcoming[0]) return upcoming[0];

  return null;
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

type WorldCupScreenViewProps = {
  activePhase: TournamentPhase;
  errorMessage: string | null;
  groups: FullGroupStandings[];
  groupMatchCountsByGroupId: Map<string, { played: number; total: number }>;
  heroMatch: MatchSummary | null;
  isLoading: boolean;
  matchesByPhase: Map<TournamentPhase, MatchSummary[]>;
  onOpenMatch: (matchId: string) => void;
  onPhaseSelect: (phase: TournamentPhase) => void;
  onRetry: () => void;
  phaseItems: PhaseTabItem[];
  totalMatchesFinished: number;
  totalMatches: number;
};

function groupDisplayName(groupId: string) {
  return `Grupo ${groupId}`;
}

export function WorldCupScreenView({
  activePhase,
  errorMessage,
  groups,
  groupMatchCountsByGroupId,
  heroMatch,
  isLoading,
  matchesByPhase,
  onOpenMatch,
  onPhaseSelect,
  onRetry,
  phaseItems,
  totalMatchesFinished,
  totalMatches
}: WorldCupScreenViewProps) {
  const { locale } = useLocale();
  const activePhaseDefinition = PHASE_DEFINITIONS.find((p) => p.phase === activePhase) ?? PHASE_DEFINITIONS[0];
  const activePhaseMatches = matchesByPhase.get(activePhase) ?? [];

  return (
    <div className="grid gap-4">
      {heroMatch ? (
        <NextMatchHero
          awayTeam={{
            teamName: heroMatch.awayTeam.name,
            fifaCode: heroMatch.awayTeam.fifaCode,
            flagAsset: heroMatch.awayTeam.flagAsset,
            flagUrl: heroMatch.awayTeam.flagUrl
          }}
          ctaLabel={copyForLocale(locale, "Ver detalle", "View details")}
          eyebrow={heroMatch.status === "live" ? copyForLocale(locale, "EN VIVO", "LIVE") : copyForLocale(locale, "PRÓXIMO PARTIDO", "NEXT MATCH")}
          homeTeam={{
            teamName: heroMatch.homeTeam.name,
            fifaCode: heroMatch.homeTeam.fifaCode,
            flagAsset: heroMatch.homeTeam.flagAsset,
            flagUrl: heroMatch.homeTeam.flagUrl
          }}
          metaLabel={`${toStageLabel(heroMatch.stage, heroMatch.groupId, locale)} · ${toLocalKickoffLabel(heroMatch.kickoffAt, locale)}`}
          onAction={() => onOpenMatch(heroMatch.matchId)}
          status={heroMatch.status === "live" ? "live" : "neutral"}
          statusLabel={heroMatch.status === "live" ? copyForLocale(locale, "En vivo", "Live") : copyForLocale(locale, "Programado", "Scheduled")}
          title={`${heroMatch.homeTeam.name} vs ${heroMatch.awayTeam.name}`}
        />
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

      <PhaseTabs items={phaseItems} activePhase={activePhase} onSelect={onPhaseSelect} />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : null}

      {errorMessage ? (
        <ErrorCard title={copyForLocale(locale, "No pudimos cargar El Mundial", "Could not load the World Cup")} message={errorMessage} onRetry={onRetry} />
      ) : null}

      {!isLoading && !errorMessage ? (
        activePhase === "groups" ? (
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
          <WorldCupMatchList
            matches={activePhaseMatches}
            emptyCopy={copyForLocale(
              locale,
              `${activePhaseDefinition.label} todavía no está disponible.`,
              `${activePhaseDefinition.label} is not available yet.`
            )}
          />
        )
      ) : null}
    </div>
  );
}

export function WorldCupScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [items, setItems] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activePhase, setActivePhase] = useState<TournamentPhase>("groups");

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
                : "No pudimos cargar El Mundial."
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

  const matchesByPhase = useMemo(() => {
    const map = new Map<TournamentPhase, MatchSummary[]>();
    for (const def of PHASE_DEFINITIONS) {
      map.set(def.phase, sortedItems.filter((m) => def.stages.includes(m.stage)));
    }
    return map;
  }, [sortedItems]);

  const groupMatches = useMemo(() => matchesByPhase.get("groups") ?? [], [matchesByPhase]);

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

  const phaseItems = useMemo<PhaseTabItem[]>(
    () =>
      PHASE_DEFINITIONS.map((def) => {
        const phaseMatches = matchesByPhase.get(def.phase) ?? [];
        return {
          phase: def.phase,
          label: def.label,
          completed: phaseMatches.filter((m) => m.status === "finished").length,
          total: phaseMatches.length,
          status: resolveOfficialPhaseStatus(phaseMatches)
        };
      }),
    [matchesByPhase]
  );

  const heroMatch = useMemo(() => pickHeroMatch(sortedItems), [sortedItems]);

  const totalMatchesFinished = useMemo(
    () => sortedItems.filter((m) => m.status === "finished").length,
    [sortedItems]
  );

  return (
    <WorldCupScreenView
      activePhase={activePhase}
      errorMessage={errorMessage}
      groups={groups}
      groupMatchCountsByGroupId={groupMatchCountsByGroupId}
      heroMatch={heroMatch}
      isLoading={isLoading}
      matchesByPhase={matchesByPhase}
      onOpenMatch={(matchId) => router.push(`${APP_ROUTES.matches}/${matchId}`)}
      onPhaseSelect={setActivePhase}
      onRetry={() => setReloadKey((k) => k + 1)}
      phaseItems={phaseItems}
      totalMatchesFinished={totalMatchesFinished}
      totalMatches={sortedItems.length}
    />
  );
}
