import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchSummary, PreTournamentSummary } from "@prode/shared";
import { TournamentScreenView } from "./tournament-screen";
import type { PredictionsTab, PredictionsTabItem } from "./predictions-tabs";
import type { ContextualHero } from "@/lib/hero/pick-contextual-hero";

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

function buildTabItems(): PredictionsTabItem[] {
  return [
    { key: "matches", label: "Partidos", completed: 2, total: 48 },
    { key: "knockouts", label: "Cruces", completed: 0, total: 16 }
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
      groupMatches: [buildQuickMatch()],
      hero,
      isLoading: false,
      knockoutMatches: [],
      onHeroAction: () => undefined,
      onOpenPicks: () => undefined,
      onOpenMatch: () => undefined,
      onRetry: () => undefined,
      onTabSelect: () => undefined,
      projection: null,
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

test("TournamentScreenView shows simplified tabs Partidos/Cruces", () => {
  const html = renderView();

  assert.match(html, /Partidos/);
  assert.match(html, /Cruces/);
  assert.doesNotMatch(html, /Mis Resultados/);
  assert.doesNotMatch(html, /Mis Predicciones/);
});

test("TournamentScreenView renders flat match list on matches tab", () => {
  const html = renderView({ activeTab: "matches" });

  assert.match(html, /Mexico/);
  assert.match(html, /South Africa/);
});

test("TournamentScreenView shows progress label for the active tab", () => {
  const html = renderView({ activeTab: "matches" });

  assert.match(html, /2 \/ 48 predicciones guardadas/);
});

test("TournamentScreenView renders knockouts empty state when no projection available", () => {
  const html = renderView({ activeTab: "knockouts" });

  assert.match(html, /Se habilitan al cerrar la fase de grupos/);
});

test("TournamentScreenView shows fallback hero when no hero match is available", () => {
  const html = renderView({ hero: null });

  assert.match(html, /Todo al dia/);
});
