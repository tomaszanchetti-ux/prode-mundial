import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LeagueSummary } from "@prode/shared";
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

test("LeaguesScreenView renders active league cards", () => {
  const html = renderToStaticMarkup(
    createElement(LeaguesScreenView, {
      items: [buildLeague()],
      isLoading: false,
      errorMessage: null,
      onRetry: () => undefined
    })
  );

  assert.match(html, /Liga Demo Madrid/);
  assert.match(html, /Activa/);
  assert.match(html, /DEMO26/);
  assert.match(html, /Estas compitiendo en el puesto #2/);
});
