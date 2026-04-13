import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LeagueDetail, LeagueSummary } from "@prode/shared";
import { LeaguesScreenView } from "./leagues-screen";

function buildLeague(overrides: Partial<LeagueSummary> = {}): LeagueSummary {
  return {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4,
    position: 2,
    userPoints: 12,
    isActive: true,
    inviteCode: "DEMO26",
    inviteLink: "http://localhost:3000/leagues/join?token=demo",
    ...overrides
  };
}

function buildLeagueDetail(overrides: Partial<LeagueDetail> = {}): LeagueDetail {
  return {
    leagueId: "lg_1",
    name: "Liga Demo Madrid",
    memberLimit: 20,
    membersCount: 4,
    isActive: true,
    inviteCode: "DEMO26",
    inviteLink: "http://localhost:3000/leagues/join?token=demo",
    membershipRole: "owner",
    myStanding: {
      position: 2,
      totalPoints: 12,
      exactHits: 1,
      correctSigns: 4,
      macroPoints: 0
    },
    ...overrides
  };
}

test("LeaguesScreenView renders active league cards", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      mode: null,
      formState: { leagueName: "", inviteCode: "" },
      actionError: null,
      actionMessage: null,
      lastActionLeague: null,
      isLoading: false,
      isSubmitting: false,
      errorMessage: null,
      onChangeMode: () => undefined,
      onFieldChange: () => undefined,
      onCreateLeague: () => undefined,
      onJoinLeague: () => undefined,
      onOpenRankings: () => undefined,
      onOpenLeagueDetail: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Liga Demo Madrid/);
  assert.match(html, /Activa/);
  assert.match(html, /DEMO26/);
  assert.match(html, /Estas compitiendo en el puesto #2/);
});

test("LeaguesScreenView renders create success state", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      mode: null,
      formState: { leagueName: "", inviteCode: "" },
      actionError: null,
      actionMessage: "Liga creada. Ya tienes codigo e invite link para compartir.",
      lastActionLeague: buildLeagueDetail(),
      isLoading: false,
      isSubmitting: false,
      errorMessage: null,
      onChangeMode: () => undefined,
      onFieldChange: () => undefined,
      onCreateLeague: () => undefined,
      onJoinLeague: () => undefined,
      onOpenRankings: () => undefined,
      onOpenLeagueDetail: () => undefined,
      onRetry: () => undefined
    })
  );

  assert.match(html, /ACCION COMPLETADA/);
  assert.match(html, /Liga creada/);
  assert.match(html, /Creador/);
});
