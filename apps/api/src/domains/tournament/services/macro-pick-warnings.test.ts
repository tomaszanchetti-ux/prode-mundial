import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  detectMacroPickWarnings,
  type TournamentProjectionBracket,
  type TournamentProjectionMatch,
  type TournamentProjectionSide
} from "@prode/shared";

type TeamPair = [string | null, string | null];

function side(team: string | null, slotLabel: string): TournamentProjectionSide {
  return {
    team: team
      ? {
          teamId: team,
          name: team,
          fifaCode: team,
          iso2: null,
          iso3: null,
          flagAsset: null,
          flagUrl: null
        }
      : null,
    slot: slotLabel,
    slotLabel
  };
}

function buildMatch(
  matchId: string,
  officialMatchNumber: number,
  stage: TournamentProjectionMatch["stage"],
  homeSlotLabel: string,
  awaySlotLabel: string,
  teams: TeamPair = [null, null]
): TournamentProjectionMatch {
  return {
    matchId,
    officialMatchNumber,
    stage,
    kickoffAt: "2026-06-30T19:00:00.000Z",
    kickoffAtEt: null,
    venueId: null,
    home: side(teams[0], homeSlotLabel),
    away: side(teams[1], awaySlotLabel),
    winnerTeamId: null,
    source: "projected"
  };
}

function buildFullBracket(teamsByR32Number: Record<number, TeamPair> = {}): TournamentProjectionBracket {
  const r32 = Array.from({ length: 16 }, (_, i) => {
    const num = 73 + i;
    return buildMatch(
      `r32_${num}`,
      num,
      "R32",
      `1A_${num}`,
      `2B_${num}`,
      teamsByR32Number[num] ?? [null, null]
    );
  });
  const r16 = Array.from({ length: 8 }, (_, i) => {
    const num = 89 + i;
    const h = 73 + i * 2;
    const a = 74 + i * 2;
    return buildMatch(`r16_${num}`, num, "R16", `W(M${h})`, `W(M${a})`);
  });
  const qf = Array.from({ length: 4 }, (_, i) => {
    const num = 97 + i;
    const h = 89 + i * 2;
    const a = 90 + i * 2;
    return buildMatch(`qf_${num}`, num, "QF", `W(M${h})`, `W(M${a})`);
  });
  const sf = [
    buildMatch("sf_101", 101, "SF", "W(M97)", "W(M98)"),
    buildMatch("sf_102", 102, "SF", "W(M99)", "W(M100)")
  ];
  const bronze = [buildMatch("bronze_103", 103, "BRONZE", "L(M101)", "L(M102)")];
  const finalMatch = [buildMatch("final_104", 104, "FINAL", "W(M101)", "W(M102)")];

  return {
    round32: r32,
    round16: r16,
    quarterfinals: qf,
    semifinals: sf,
    bronze,
    final: finalMatch
  };
}

describe("detectMacroPickWarnings — eliminated picks (groups closed)", () => {
  it("emits champion_eliminated when champion team is not alive", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "GER",
      subChampionTeamId: null,
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].kind, "champion_eliminated");
    assert.deepEqual(warnings[0].picks, ["champion"]);
  });

  it("emits sub_champion_eliminated when sub-champion team is not alive", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "ITA",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].kind, "sub_champion_eliminated");
    assert.deepEqual(warnings[0].picks, ["sub_champion"]);
  });

  it("emits best_player_eliminated when the player's team is not alive", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: null,
      subChampionTeamId: null,
      bestPlayerTeamId: "MEX",
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].kind, "best_player_eliminated");
    assert.deepEqual(warnings[0].picks, ["best_player"]);
  });

  it("does NOT emit eliminated warnings when groups are still in progress", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "GER",
      subChampionTeamId: "ITA",
      bestPlayerTeamId: "MEX",
      areGroupsOfficiallyClosed: false
    });
    assert.equal(warnings.length, 0);
  });

  it("does NOT emit eliminated warnings when the bracket has no teams yet (alive set empty)", () => {
    const bracket = buildFullBracket();
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "GER",
      subChampionTeamId: "ITA",
      bestPlayerTeamId: "MEX",
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.length, 0);
  });

  it("emits no eliminated warning when pick team IS alive", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "BRA",
      bestPlayerTeamId: "ARG",
      areGroupsOfficiallyClosed: true
    });
    // No eliminated warnings (all alive). No same_half either (ARG in A, BRA in B).
    assert.equal(warnings.length, 0);
  });
});

describe("detectMacroPickWarnings — same_half", () => {
  it("emits same_half when champion and sub-champion are both in half A", () => {
    // ARG in r32_73 (A), MEX in r32_77 (A)
    const bracket = buildFullBracket({ 73: ["ARG", null], 77: ["MEX", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "MEX",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    const sameHalf = warnings.find((w) => w.kind === "same_half");
    assert.ok(sameHalf);
    assert.deepEqual(sameHalf!.picks, ["champion", "sub_champion"]);
  });

  it("emits same_half when both picks are in half B (symmetry)", () => {
    const bracket = buildFullBracket({ 85: ["BRA", null], 87: ["POR", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "BRA",
      subChampionTeamId: "POR",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    const sameHalf = warnings.find((w) => w.kind === "same_half");
    assert.ok(sameHalf);
  });

  it("does NOT emit same_half when picks are in opposite halves", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null], 85: ["BRA", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "BRA",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.filter((w) => w.kind === "same_half").length, 0);
  });

  it("does NOT emit same_half when one of the picks is unresolved (no R32 slot)", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "BRA",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.filter((w) => w.kind === "same_half").length, 0);
  });

  it("does NOT emit same_half when champion and sub-champion are the same team", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "ARG",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    assert.equal(warnings.filter((w) => w.kind === "same_half").length, 0);
  });

  it("emits same_half even when groups are NOT officially closed (pre-tournament projection)", () => {
    // same_half es estructural (depende del bracket proyectado), no de
    // que los grupos estén cerrados — se detecta incluso en ventana A
    // si el bracket proyectado ya lo muestra.
    const bracket = buildFullBracket({ 73: ["ARG", null], 77: ["MEX", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "MEX",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: false
    });
    const sameHalf = warnings.find((w) => w.kind === "same_half");
    assert.ok(sameHalf);
  });
});

describe("detectMacroPickWarnings — combinados", () => {
  it("emits both champion_eliminated and sub_champion_eliminated independently", () => {
    const bracket = buildFullBracket({ 73: ["ARG", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "GER",
      subChampionTeamId: "ITA",
      bestPlayerTeamId: null,
      areGroupsOfficiallyClosed: true
    });
    const kinds = warnings.map((w) => w.kind).sort();
    assert.deepEqual(kinds, ["champion_eliminated", "sub_champion_eliminated"]);
  });

  it("emits best_player_eliminated together with same_half", () => {
    // ARG (A) + MEX (A) → same_half. Balón de Oro team "ITA" eliminado.
    const bracket = buildFullBracket({ 73: ["ARG", null], 77: ["MEX", null] });
    const warnings = detectMacroPickWarnings({
      bracket,
      championTeamId: "ARG",
      subChampionTeamId: "MEX",
      bestPlayerTeamId: "ITA",
      areGroupsOfficiallyClosed: true
    });
    const kinds = warnings.map((w) => w.kind).sort();
    assert.deepEqual(kinds, ["best_player_eliminated", "same_half"]);
  });
});
