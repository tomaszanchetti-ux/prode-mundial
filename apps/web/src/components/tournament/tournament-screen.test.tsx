import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary, PreTournamentSummary, PredictedGroupStandingRow, TuMundialGroupCard } from "@prode/shared";
import { TournamentScreenView } from "./tournament-screen";
import type { PredictionsTab, PredictionsTabItem } from "./predictions-tabs";
import type { ContextualHero } from "@/lib/hero/pick-contextual-hero";

function buildProjectedRow(teamId: string, teamName: string, points: number, position: number): PredictedGroupStandingRow {
  return {
    teamId,
    teamName,
    fifaCode: teamId,
    iso2: null,
    iso3: null,
    flagAsset: "/flags/mock.svg",
    flagUrl: null,
    played: 2,
    won: position === 1 ? 2 : 1,
    drawn: 0,
    lost: position === 1 ? 0 : 1,
    goalsFor: position === 1 ? 4 : 2,
    goalsAgainst: position === 1 ? 1 : 3,
    goalDifference: position === 1 ? 3 : -1,
    points,
    position,
    isProjectedQualified: true
  };
}

function buildPreTournamentSummary(overrides: Partial<PreTournamentSummary> = {}): PreTournamentSummary {
  return {
    isPreTournament: true,
    completedMatches: 12,
    totalMatches: 48,
    remainingMatches: 36,
    completionPercentage: 25,
    nextPendingMatchId: "m_001",
    ...overrides
  };
}

function buildGroup(overrides: Partial<TuMundialGroupCard> = {}): TuMundialGroupCard {
  return {
    groupId: "A",
    groupName: "Grupo A",
    completedMatches: 2,
    totalMatches: 6,
    isComplete: false,
    items: [
      buildProjectedRow("MEX", "Mexico", 6, 1),
      buildProjectedRow("RSA", "South Africa", 3, 2)
    ],
    ...overrides
  };
}

function buildTabItems(): PredictionsTabItem[] {
  return [
    { key: "matches", label: "Partidos", completed: 2, total: 48 },
    { key: "knockouts", label: "Knockouts", completed: 0, total: 16 }
  ];
}

function buildQuickMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    matchId: "m_001",
    stage: "group",
    groupId: "A",
    homeTeam: {
      teamId: "MEX",
      name: "Mexico",
      fifaCode: "MEX",
      iso2: null,
      iso3: null,
      flagAsset: "/flags/mock.svg",
      flagUrl: null
    },
    awayTeam: {
      teamId: "RSA",
      name: "South Africa",
      fifaCode: "RSA",
      iso2: null,
      iso3: null,
      flagAsset: "/flags/mock.svg",
      flagUrl: null
    },
    kickoffAt: "2026-06-12T20:00:00.000Z",
    predictionOpensAt: "2026-06-12T08:00:00.000Z",
    status: "scheduled",
    deadlineAt: "2026-06-12T19:00:00.000Z",
    isLocked: false,
    isFinished: false,
    isScored: false,
    predictionStatus: "empty",
    userPredictionSummary: null,
    isEditable: true,
    ctaLabel: "Predecir",
    homeScore90: null,
    awayScore90: null,
    officialMatchNumber: null,
    homeSlot: null,
    awaySlot: null,
    winnerTeamId: null,
    ...overrides
  };
}

function renderView(
  overrides: {
    activeTab?: PredictionsTab;
    preTournamentSummary?: PreTournamentSummary;
    hero?: ContextualHero | null;
  } = {}
) {
  const hero: ContextualHero | null =
    "hero" in overrides ? overrides.hero! : { match: buildQuickMatch(), state: "pending" };

  return renderToStaticMarkup(
    createElement(TournamentScreenView, {
      activeTab: overrides.activeTab ?? "matches",
      errorMessage: null,
      groups: [buildGroup()],
      hero,
      isLoading: false,
      knockoutMatches: [],
      matchesByGroupId: new Map(),
      onHeroAction: () => undefined,
      onOpenPicks: () => undefined,
      onOpenMatch: () => undefined,
      onRetry: () => undefined,
      onTabSelect: () => undefined,
      tabItems: buildTabItems(),
      preTournamentSummary: overrides.preTournamentSummary ?? buildPreTournamentSummary(),
      championPick: null,
      subChampionPick: null,
      bestPlayerPick: null
    })
  );
}

test("TournamentScreenView renders next-match hero as clickable card", () => {
  const html = renderView();

  assert.match(html, /TU PROXIMO/);
  assert.match(html, /Mexico/);
  assert.match(html, /South Africa/);
  assert.match(html, /aria-label="Mexico vs South Africa"/);
});

test("TournamentScreenView shows simplified tabs Partidos/Knockouts", () => {
  const html = renderView();

  assert.match(html, /Partidos/);
  assert.match(html, /Knockouts/);
  assert.doesNotMatch(html, /Mis Resultados/);
  assert.doesNotMatch(html, /Mis Predicciones/);
});

test("TournamentScreenView renders predictions groups accordion on matches tab", () => {
  const html = renderView({ activeTab: "matches" });

  assert.match(html, /Grupo A/);
});

test("TournamentScreenView shows fallback hero when no hero match is available", () => {
  const html = renderView({ hero: null });

  assert.match(html, /Todo al dia/);
});
